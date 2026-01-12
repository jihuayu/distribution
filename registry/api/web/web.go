// Package web provides web-based management interface for the registry
package web

import (
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"net/http"
	"time"

	"github.com/distribution/distribution/v3"
	"github.com/distribution/distribution/v3/configuration"
	"github.com/distribution/distribution/v3/version"
	"github.com/distribution/reference"
	"github.com/gorilla/mux"
)

//go:embed static
var staticFiles embed.FS

// Handler provides web management endpoints
type Handler struct {
	config   *configuration.Configuration
	registry distribution.Namespace
}

// NewHandler creates a new web management handler
func NewHandler(config *configuration.Configuration, registry distribution.Namespace) *Handler {
	return &Handler{
		config:   config,
		registry: registry,
	}
}

// RegisterRoutes registers all web management routes to the provided router
func (h *Handler) RegisterRoutes(router *mux.Router) {
	// API endpoints
	router.HandleFunc("/api/v1/status", h.handleStatus).Methods("GET")
	router.HandleFunc("/api/v1/config", h.handleConfig).Methods("GET")
	router.HandleFunc("/api/v1/repositories", h.handleListRepositories).Methods("GET")
	router.HandleFunc("/api/v1/health", h.handleHealth).Methods("GET")
	
	// Serve static files for the frontend
	h.serveStaticFiles(router)
}

// handleStatus returns the current status of the registry
func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"status":    "healthy",
		"version":   version.Version(),
		"revision":  version.Revision(),
		"timestamp": time.Now(),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleConfig returns sanitized configuration
func (h *Handler) handleConfig(w http.ResponseWriter, r *http.Request) {
	// Return sanitized config without sensitive data
	config := map[string]interface{}{
		"version": h.config.Version,
		"log": map[string]interface{}{
			"level": h.config.Log.Level,
		},
		"http": map[string]interface{}{
			"addr": h.config.HTTP.Addr,
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// handleListRepositories returns a list of repositories
func (h *Handler) handleListRepositories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	repos := make([]string, 0)
	last := ""
	
	// Get repositories in batches
	for {
		batch := make([]string, 100)
		n, err := h.registry.Repositories(ctx, batch, last)
		if n > 0 {
			repos = append(repos, batch[:n]...)
			last = batch[n-1]
		}
		if err != nil || n < len(batch) {
			break
		}
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"repositories": repos,
		"count":        len(repos),
	})
}

// handleHealth provides a simple health check
func (h *Handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

// serveStaticFiles serves the frontend static files
func (h *Handler) serveStaticFiles(router *mux.Router) {
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		// Static files not available, skip serving them
		return
	}
	
	fileServer := http.FileServer(http.FS(staticFS))
	
	// Serve static files
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fileServer))
	
	// Serve index.html for web UI routes (excluding API and v2 routes)
	router.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't serve index.html for API routes
		path := r.URL.Path
		if len(path) > 4 && path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}
		// Don't serve index.html for v2 registry API
		if len(path) > 3 && path[:3] == "/v2" {
			http.NotFound(w, r)
			return
		}
		
		indexFile, err := staticFS.Open("index.html")
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer indexFile.Close()
		
		stat, err := indexFile.Stat()
		if err != nil {
			http.NotFound(w, r)
			return
		}
		
		http.ServeContent(w, r, "index.html", stat.ModTime(), indexFile.(io.ReadSeeker))
	})
}

// GetRepository returns information about a specific repository
func (h *Handler) GetRepository(name string) (map[string]interface{}, error) {
	named, err := reference.WithName(name)
	if err != nil {
		return nil, err
	}
	
	ctx := (&http.Request{}).Context()
	repo, err := h.registry.Repository(ctx, named)
	if err != nil {
		return nil, err
	}
	
	// Get tags
	tagService := repo.Tags(ctx)
	tags, _ := tagService.All(ctx)
	
	return map[string]interface{}{
		"name": name,
		"tags": tags,
	}, nil
}
