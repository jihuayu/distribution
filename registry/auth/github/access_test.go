package github

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNewAccessController(t *testing.T) {
	tests := []struct {
		name    string
		options map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid configuration",
			options: map[string]interface{}{
				"realm": "test-realm",
			},
			wantErr: false,
		},
		{
			name:    "missing realm",
			options: map[string]interface{}{},
			wantErr: true,
		},
		{
			name: "with allowed orgs",
			options: map[string]interface{}{
				"realm":        "test-realm",
				"allowed_orgs": []interface{}{"org1", "org2"},
			},
			wantErr: false,
		},
		{
			name: "with OIDC enabled",
			options: map[string]interface{}{
				"realm":         "test-realm",
				"enable_oidc":   true,
				"oidc_audience": "https://example.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ac, err := newAccessController(tt.options)
			if (err != nil) != tt.wantErr {
				t.Errorf("newAccessController() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && ac == nil {
				t.Error("newAccessController() returned nil controller")
			}
		})
	}
}

func TestAuthorized_NoToken(t *testing.T) {
	ac := &accessController{
		realm: "test-realm",
	}

	req := httptest.NewRequest("GET", "/v2/", nil)
	_, err := ac.Authorized(req)

	if err == nil {
		t.Error("expected error for request without authorization header")
	}

	if _, ok := err.(*challenge); !ok {
		t.Errorf("expected *challenge error, got %T", err)
	}
}

func TestAuthorized_InvalidToken(t *testing.T) {
	ac := &accessController{
		realm: "test-realm",
	}

	tests := []struct {
		name   string
		header string
	}{
		{
			name:   "invalid prefix",
			header: "Basic dXNlcjpwYXNz",
		},
		{
			name:   "empty token",
			header: "Bearer ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/v2/", nil)
			req.Header.Set("Authorization", tt.header)

			_, err := ac.Authorized(req)
			if err == nil {
				t.Error("expected error for invalid authorization header")
			}
		})
	}
}

func TestAuthorized_GitHubToken_Success(t *testing.T) {
	// Create mock GitHub API server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/user" {
			auth := r.Header.Get("Authorization")
			if auth != "token valid-token" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(githubUser{
				Login: "testuser",
				ID:    12345,
				Type:  "User",
			})
		}
	}))
	defer server.Close()

	ac := &accessController{
		realm:        "test-realm",
		githubAPIURL: server.URL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}

	req := httptest.NewRequest("GET", "/v2/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")

	grant, err := ac.Authorized(req)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if grant == nil {
		t.Fatal("expected non-nil grant")
	}

	if grant.User.Name != "testuser" {
		t.Errorf("expected user name 'testuser', got '%s'", grant.User.Name)
	}
}

func TestAuthorized_GitHubToken_Failure(t *testing.T) {
	// Create mock GitHub API server that rejects tokens
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Bad credentials",
		})
	}))
	defer server.Close()

	ac := &accessController{
		realm:        "test-realm",
		githubAPIURL: server.URL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}

	req := httptest.NewRequest("GET", "/v2/", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")

	_, err := ac.Authorized(req)
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestCheckOrgMembership(t *testing.T) {
	tests := []struct {
		name           string
		username       string
		serverResponse int
		expectedResult bool
	}{
		{
			name:           "member of organization",
			username:       "testuser",
			serverResponse: http.StatusNoContent,
			expectedResult: true,
		},
		{
			name:           "not a member",
			username:       "testuser",
			serverResponse: http.StatusNotFound,
			expectedResult: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if strings.Contains(r.URL.Path, "/orgs/") && strings.Contains(r.URL.Path, "/members/") {
					w.WriteHeader(tt.serverResponse)
				}
			}))
			defer server.Close()

			ac := &accessController{
				realm:        "test-realm",
				githubAPIURL: server.URL,
				allowedOrgs:  []string{"testorg"},
				httpClient: &http.Client{
					Timeout: 5 * time.Second,
				},
			}

			result := ac.checkOrgMembership(context.Background(), "test-token", tt.username)
			if result != tt.expectedResult {
				t.Errorf("checkOrgMembership() = %v, want %v", result, tt.expectedResult)
			}
		})
	}
}

func TestDecodeOIDCToken(t *testing.T) {
	ac := &accessController{}

	// Create a simple JWT token for testing
	now := time.Now().Unix()
	payload := oidcTokenPayload{
		Sub:        "repo:owner/repo:ref:refs/heads/main",
		Aud:        "https://example.com",
		Repository: "owner/repo",
		Actor:      "testuser",
		Workflow:   "CI",
		Ref:        "refs/heads/main",
		Exp:        now + 3600,
		Iat:        now,
	}

	payloadJSON, _ := json.Marshal(payload)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Create a fake JWT (header.payload.signature)
	token := fmt.Sprintf("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.%s.fake-signature", payloadB64)

	decoded, err := ac.decodeOIDCToken(token)
	if err != nil {
		t.Fatalf("decodeOIDCToken() error = %v", err)
	}

	if decoded.Actor != "testuser" {
		t.Errorf("expected actor 'testuser', got '%s'", decoded.Actor)
	}

	if decoded.Repository != "owner/repo" {
		t.Errorf("expected repository 'owner/repo', got '%s'", decoded.Repository)
	}
}

func TestDecodeOIDCToken_Invalid(t *testing.T) {
	ac := &accessController{}

	tests := []struct {
		name  string
		token string
	}{
		{
			name:  "not enough parts",
			token: "invalid.token",
		},
		{
			name:  "invalid base64",
			token: "header.!!invalid!!.signature",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ac.decodeOIDCToken(tt.token)
			if err == nil {
				t.Error("expected error for invalid token")
			}
		})
	}
}

func TestAuthenticateOIDC_Success(t *testing.T) {
	now := time.Now().Unix()
	payload := oidcTokenPayload{
		Sub:        "repo:owner/repo:ref:refs/heads/main",
		Aud:        "https://example.com",
		Repository: "owner/repo",
		Actor:      "github-actions",
		Workflow:   "CI",
		Ref:        "refs/heads/main",
		Exp:        now + 3600,
		Iat:        now,
	}

	payloadJSON, _ := json.Marshal(payload)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)
	token := fmt.Sprintf("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.%s.fake-signature", payloadB64)

	ac := &accessController{
		realm:        "test-realm",
		enableOIDC:   true,
		oidcAudience: "https://example.com",
	}

	grant, err := ac.authenticateOIDC(context.Background(), token)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if grant == nil {
		t.Fatal("expected non-nil grant")
	}

	if grant.User.Name != "github-actions" {
		t.Errorf("expected user name 'github-actions', got '%s'", grant.User.Name)
	}
}

func TestAuthenticateOIDC_ExpiredToken(t *testing.T) {
	now := time.Now().Unix()
	payload := oidcTokenPayload{
		Sub:        "repo:owner/repo:ref:refs/heads/main",
		Aud:        "https://example.com",
		Repository: "owner/repo",
		Actor:      "github-actions",
		Exp:        now - 3600, // Expired
		Iat:        now - 7200,
	}

	payloadJSON, _ := json.Marshal(payload)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)
	token := fmt.Sprintf("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.%s.fake-signature", payloadB64)

	ac := &accessController{
		realm:      "test-realm",
		enableOIDC: true,
	}

	_, err := ac.authenticateOIDC(context.Background(), token)
	if err == nil {
		t.Error("expected error for expired token")
	}
}

func TestBase64URLDecode(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:  "valid input",
			input: base64.RawURLEncoding.EncodeToString([]byte("hello world")),
			want:  "hello world",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := base64URLDecode(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("base64URLDecode() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && string(got) != tt.want {
				t.Errorf("base64URLDecode() = %v, want %v", string(got), tt.want)
			}
		})
	}
}
