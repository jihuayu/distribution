# Web Management Interface

This document describes the new web-based management interface for the Distribution Registry.

## Overview

The web management interface provides a modern **React-based** dashboard for managing and monitoring your container registry. It includes:

- **Dashboard**: View registry status, version, and statistics
- **Repository Management**: List and view repositories
- **API Endpoints**: RESTful API for programmatic access
- **Configuration Viewing**: View (sanitized) registry configuration
- **React Frontend**: Modern, component-based UI with React Router
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Configuration

Enable the web management interface in your configuration file:

```yaml
version: 0.1

storage:
  filesystem:
    rootdirectory: /var/lib/registry

http:
  addr: :5000

# Enable web management interface
webmanagement:
  enabled: true
  
  # Optional: GitHub OAuth (for future authentication)
  oauth:
    github:
      clientid: YOUR_GITHUB_CLIENT_ID
      clientsecret: YOUR_GITHUB_CLIENT_SECRET
      redirecturl: http://localhost:5000/api/v1/auth/callback
  
  # Optional: CDN Configuration
  cdn:
    enabled: false
    provider: cloudfront  # cloudfront, cloudflare, or custom
    baseurl: https://cdn.example.com
    headers:
      Cache-Control: "public, max-age=31536000"
```

## Usage

1. Start the registry with web management enabled:
   ```bash
   ./bin/registry serve config.yml
   ```

2. Access the web dashboard at:
   ```
   http://localhost:5000/
   ```

3. API endpoints are available at:
   - `GET /api/v1/status` - Registry status and version
   - `GET /api/v1/health` - Health check
   - `GET /api/v1/config` - View registry configuration (sanitized)
   - `GET /api/v1/repositories` - List all repositories

## API Examples

### Get Registry Status
```bash
curl http://localhost:5000/api/v1/status
```

Response:
```json
{
  "status": "healthy",
  "version": "v3.0.0",
  "revision": "abc123",
  "timestamp": "2026-01-12T07:00:00Z"
}
```

### List Repositories
```bash
curl http://localhost:5000/api/v1/repositories
```

Response:
```json
{
  "repositories": ["myapp", "nginx", "postgres"],
  "count": 3
}
```

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

Response:
```json
{
  "status": "ok"
}
```

## Features

### Current Features
- ✅ Web dashboard with registry status
- ✅ Repository listing via API
- ✅ Configuration viewing (sanitized)
- ✅ Health check endpoints
- ✅ Embedded static files (no external dependencies)
- ✅ Compatible with existing v2 registry API

### Planned Features
- 🔄 GitHub OAuth authentication
- 🔄 CDN integration for blob delivery
- 🔄 Repository detailed view
- 🔄 Tag management
- 🔄 Configuration editing via UI
- 🔄 Event notifications dashboard
- 🔄 Upload/download metrics

## Architecture

The web management interface is built with:

- **Backend**: Go handlers integrated into the registry application
- **Frontend**: React 18 with React Router for client-side routing
- **API**: RESTful endpoints at `/api/v1/*`
- **Build Tool**: Vite for fast development and optimized production builds
- **Integration**: Seamlessly integrated with existing v2 API

### URL Routing

- `/` - React dashboard (SPA)
- `/repositories` - Repository browser
- `/settings` - Configuration viewer
- `/api/v1/*` - Web management API endpoints
- `/v2/*` - Docker Registry v2 API (unchanged)

## Development

### Building with Web Management

The web management interface is automatically included when building the registry:

```bash
# Build frontend first
cd frontend
npm install
npm run build

# Then build registry
cd ..
make binaries
```

### Frontend Development

The frontend is a React application located in the `frontend/` directory.

**Setup:**
```bash
cd frontend
npm install
```

**Development mode (with hot reload):**
```bash
npm run dev
# Access at http://localhost:5173 (proxies API to localhost:5000)
```

**Build for production:**
```bash
npm run build
# Outputs to ../registry/api/web/static
```

The production build is automatically embedded into the registry binary.

**Frontend Structure:**
```
frontend/
├── src/
│   ├── App.jsx              # Main app with routing
│   ├── components/
│   │   ├── Dashboard.jsx    # Dashboard page
│   │   ├── Repositories.jsx # Repository list
│   │   └── Settings.jsx     # Configuration viewer
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── package.json
└── vite.config.js           # Vite build configuration
```

### Adding New API Endpoints

1. Add handler function in `registry/api/web/web.go`
2. Register route in `RegisterRoutes` method
3. Update frontend to consume the new endpoint
4. Update this documentation

## Security Considerations

1. **Authentication**: Current implementation does not enforce authentication on web management endpoints. In production, use:
   - Reverse proxy with authentication (recommended)
   - GitHub OAuth (when implemented)
   - Network-level restrictions

2. **Sensitive Data**: Configuration endpoint automatically sanitizes sensitive information like secrets and credentials.

3. **CORS**: Currently not configured. Add CORS headers if accessing from different domains.

## Backward Compatibility

- The web management interface is **disabled by default**
- Existing registry functionality is **unchanged**
- All v2 API endpoints work exactly as before
- No breaking changes to existing deployments

## Troubleshooting

### Web Interface Not Loading

1. Check that `webmanagement.enabled` is set to `true` in configuration
2. Verify registry logs show: "Web management interface configured successfully"
3. Ensure no conflicts with HTTP prefix configuration

### API Endpoints Return 404

- Web management only responds when enabled
- Check if path conflicts with existing middleware
- Verify the registry is listening on the correct port

### Cannot List Repositories

- Ensure storage driver is properly configured
- Check filesystem permissions
- Verify repositories exist in storage backend

## Contributing

To contribute to the web management interface:

1. Add new features in `registry/api/web/`
2. Update configuration structures in `configuration/configuration.go`
3. Test with various registry configurations
4. Update this documentation

## License

Same as the main Distribution project (Apache 2.0)
