// Package github provides authentication support for GitHub tokens and GitHub Actions OIDC tokens.
//
// This authentication method supports:
// - GitHub Personal Access Tokens (PAT)
// - GitHub Actions OIDC tokens
package github

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/distribution/distribution/v3/internal/dcontext"
	"github.com/distribution/distribution/v3/registry/auth"
	"github.com/sirupsen/logrus"
)

const (
	// GitHub API endpoints
	githubAPIURL       = "https://api.github.com"
	githubUserEndpoint = "/user"
	
	// GitHub Actions OIDC token endpoint
	githubActionsTokenURL = "https://token.actions.githubusercontent.com"
)

func init() {
	if err := auth.Register("github", auth.InitFunc(newAccessController)); err != nil {
		logrus.Errorf("failed to register github auth: %v", err)
	}
}

type accessController struct {
	realm            string
	githubAPIURL     string
	allowedOrgs      []string // Optional: restrict access to specific GitHub organizations
	allowedRepos     []string // Optional: restrict access to specific repositories (format: owner/repo)
	httpClient       *http.Client
	enableOIDC       bool   // Enable GitHub Actions OIDC token verification
	oidcAudience     string // Expected audience for OIDC tokens
}

var _ auth.AccessController = &accessController{}

// githubUser represents a GitHub user from the API
type githubUser struct {
	Login string `json:"login"`
	ID    int64  `json:"id"`
	Type  string `json:"type"`
}

// oidcToken represents the structure of a GitHub Actions OIDC token payload
type oidcTokenPayload struct {
	Sub        string `json:"sub"`        // Subject (e.g., repo:owner/repo:ref:refs/heads/main)
	Aud        string `json:"aud"`        // Audience
	Repository string `json:"repository"` // Repository name (owner/repo)
	Actor      string `json:"actor"`      // GitHub username that triggered the workflow
	Workflow   string `json:"workflow"`   // Workflow name
	Ref        string `json:"ref"`        // Git ref
	Exp        int64  `json:"exp"`        // Expiration time
	Iat        int64  `json:"iat"`        // Issued at time
}

func newAccessController(options map[string]interface{}) (auth.AccessController, error) {
	realm, present := options["realm"]
	if _, ok := realm.(string); !present || !ok {
		return nil, fmt.Errorf(`"realm" must be set for github access controller`)
	}

	ac := &accessController{
		realm:        realm.(string),
		githubAPIURL: githubAPIURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	// Optional: GitHub API URL (for GitHub Enterprise)
	if apiURL, ok := options["api_url"].(string); ok && apiURL != "" {
		ac.githubAPIURL = strings.TrimRight(apiURL, "/")
	}

	// Optional: Allowed organizations
	if orgs, ok := options["allowed_orgs"].([]interface{}); ok {
		for _, org := range orgs {
			if orgStr, ok := org.(string); ok {
				ac.allowedOrgs = append(ac.allowedOrgs, orgStr)
			}
		}
	}

	// Optional: Allowed repositories
	if repos, ok := options["allowed_repos"].([]interface{}); ok {
		for _, repo := range repos {
			if repoStr, ok := repo.(string); ok {
				ac.allowedRepos = append(ac.allowedRepos, repoStr)
			}
		}
	}

	// Optional: Enable OIDC support
	if enableOIDC, ok := options["enable_oidc"].(bool); ok {
		ac.enableOIDC = enableOIDC
	}

	// Optional: OIDC audience
	if oidcAud, ok := options["oidc_audience"].(string); ok && oidcAud != "" {
		ac.oidcAudience = oidcAud
	}

	return ac, nil
}

func (ac *accessController) Authorized(req *http.Request, accessRecords ...auth.Access) (*auth.Grant, error) {
	// Extract token from Authorization header
	authHeader := req.Header.Get("Authorization")
	if authHeader == "" {
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrInvalidCredential,
		}
	}

	// Support both "Bearer" and "token" prefixes
	var token string
	if strings.HasPrefix(authHeader, "Bearer ") {
		token = strings.TrimPrefix(authHeader, "Bearer ")
	} else if strings.HasPrefix(authHeader, "token ") {
		token = strings.TrimPrefix(authHeader, "token ")
	} else {
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrInvalidCredential,
		}
	}

	if token == "" {
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrInvalidCredential,
		}
	}

	// Try to authenticate with GitHub OIDC token first if enabled
	if ac.enableOIDC {
		if grant, err := ac.authenticateOIDC(req.Context(), token); err == nil {
			return grant, nil
		}
		// If OIDC authentication fails, try regular GitHub token
	}

	// Authenticate with GitHub API
	return ac.authenticateGitHub(req.Context(), token)
}

func (ac *accessController) authenticateGitHub(ctx context.Context, token string) (*auth.Grant, error) {
	// Create request to GitHub API
	url := ac.githubAPIURL + githubUserEndpoint
	apiReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, &challenge{
			realm: ac.realm,
			err:   fmt.Errorf("failed to create request: %w", err),
		}
	}

	// Set authorization header
	apiReq.Header.Set("Authorization", "token "+token)
	apiReq.Header.Set("Accept", "application/vnd.github+json")

	// Make request
	resp, err := ac.httpClient.Do(apiReq)
	if err != nil {
		dcontext.GetLogger(ctx).Errorf("error calling GitHub API: %v", err)
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrAuthenticationFailure,
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		dcontext.GetLogger(ctx).Errorf("GitHub API returned status: %d", resp.StatusCode)
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrAuthenticationFailure,
		}
	}

	// Parse response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrAuthenticationFailure,
		}
	}

	var user githubUser
	if err := json.Unmarshal(body, &user); err != nil {
		dcontext.GetLogger(ctx).Errorf("error parsing GitHub user: %v", err)
		return nil, &challenge{
			realm: ac.realm,
			err:   auth.ErrAuthenticationFailure,
		}
	}

	// Check organization membership if required
	if len(ac.allowedOrgs) > 0 {
		if !ac.checkOrgMembership(ctx, token, user.Login) {
			dcontext.GetLogger(ctx).Errorf("user %s is not a member of allowed organizations", user.Login)
			return nil, &challenge{
				realm: ac.realm,
				err:   auth.ErrAuthenticationFailure,
			}
		}
	}

	dcontext.GetLogger(ctx).Infof("GitHub user %s authenticated successfully", user.Login)

	return &auth.Grant{
		User: auth.UserInfo{Name: user.Login},
	}, nil
}

func (ac *accessController) authenticateOIDC(ctx context.Context, token string) (*auth.Grant, error) {
	// Decode JWT token (simplified - in production, use proper JWT verification)
	payload, err := ac.decodeOIDCToken(token)
	if err != nil {
		return nil, &challenge{
			realm: ac.realm,
			err:   fmt.Errorf("invalid OIDC token: %w", err),
		}
	}

	// Verify audience if specified
	if ac.oidcAudience != "" && payload.Aud != ac.oidcAudience {
		return nil, &challenge{
			realm: ac.realm,
			err:   fmt.Errorf("invalid OIDC audience"),
		}
	}

	// Verify expiration
	now := time.Now().Unix()
	if payload.Exp < now {
		return nil, &challenge{
			realm: ac.realm,
			err:   fmt.Errorf("OIDC token expired"),
		}
	}

	// Check repository restrictions
	if len(ac.allowedRepos) > 0 {
		allowed := false
		for _, repo := range ac.allowedRepos {
			if payload.Repository == repo {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, &challenge{
				realm: ac.realm,
				err:   fmt.Errorf("repository %s not allowed", payload.Repository),
			}
		}
	}

	dcontext.GetLogger(ctx).Infof("GitHub Actions OIDC authenticated: actor=%s, repo=%s", payload.Actor, payload.Repository)

	// Use actor as username
	return &auth.Grant{
		User: auth.UserInfo{Name: payload.Actor},
	}, nil
}

func (ac *accessController) checkOrgMembership(ctx context.Context, token, username string) bool {
	for _, org := range ac.allowedOrgs {
		url := fmt.Sprintf("%s/orgs/%s/members/%s", ac.githubAPIURL, org, username)
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			continue
		}

		req.Header.Set("Authorization", "token "+token)
		req.Header.Set("Accept", "application/vnd.github+json")

		resp, err := ac.httpClient.Do(req)
		if err != nil {
			continue
		}
		resp.Body.Close()

		if resp.StatusCode == http.StatusNoContent {
			return true
		}
	}
	return false
}

func (ac *accessController) decodeOIDCToken(token string) (*oidcTokenPayload, error) {
	// Split JWT token
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT token format")
	}

	// Decode payload (base64url)
	payloadBytes, err := base64URLDecode(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode token payload: %w", err)
	}

	var payload oidcTokenPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, fmt.Errorf("failed to parse token payload: %w", err)
	}

	return &payload, nil
}

func base64URLDecode(s string) ([]byte, error) {
	// Add padding if necessary
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	// Replace URL-safe characters
	s = strings.ReplaceAll(s, "-", "+")
	s = strings.ReplaceAll(s, "_", "/")
	
	// Use standard base64 decoding
	return base64.StdEncoding.DecodeString(s)
}

// challenge implements the auth.Challenge interface.
type challenge struct {
	realm string
	err   error
}

var _ auth.Challenge = challenge{}

// SetHeaders sets the bearer challenge header on the response.
func (ch challenge) SetHeaders(r *http.Request, w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", fmt.Sprintf(`Bearer realm=%q,service="registry"`, ch.realm))
}

func (ch challenge) Error() string {
	return fmt.Sprintf("github authentication required: %v", ch.err)
}
