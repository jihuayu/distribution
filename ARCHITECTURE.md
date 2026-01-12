# React Frontend + Registry Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           React Application (SPA)                     │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Dashboard  │  │ Repositories │  │  Settings   │ │ │
│  │  │   Page      │  │     Page     │  │    Page     │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         │                  │                 │        │ │
│  │         └──────────────────┴─────────────────┘        │ │
│  │                       │                                │ │
│  │              React Router (/)                          │ │
│  └───────────────────────────┬───────────────────────────┘ │
└────────────────────────────┬─┴─────────────────────────────┘
                             │
                   HTTP Requests (Fetch API)
                             │
┌────────────────────────────┴───────────────────────────────┐
│                 Registry Server (:5000)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Gorilla Mux Router                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /                 → React App (embedded)           │  │
│  │  /repositories     → React App (SPA routing)        │  │
│  │  /settings         → React App (SPA routing)        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /api/v1/status    → Status Handler                 │  │
│  │  /api/v1/config    → Config Handler                 │  │
│  │  /api/v1/repositories → Repository Handler          │  │
│  │  /api/v1/health    → Health Handler                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /v2/*             → Docker Registry v2 API         │  │
│  │                       (unchanged)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────┴────────────────────────────┐ │
│  │          Registry Core Components                     │ │
│  │  • Storage Driver (filesystem/S3/Azure/GCS)          │ │
│  │  • Blob Cache (optional Redis)                        │ │
│  │  • Notifications (webhooks)                           │ │
│  │  • Authentication                                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴───────────────────────────────┐
│                   Storage Backend                           │
│  • Local Filesystem: /var/lib/registry                     │
│  • Cloud Storage: S3 / Azure Blob / Google Cloud Storage  │
│  • No Database Required!                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Visits Dashboard (/)

```
Browser                React App              Go Server
   │                      │                       │
   ├─────── GET / ───────>│                       │
   │                      ├──── GET /api/v1/status ───────>│
   │                      │                       │         │
   │                      │<──── JSON response ───┤         │
   │                      │                       │         │
   │                      ├─ GET /api/v1/repositories ───>│
   │                      │                       │         │
   │                      │<──── JSON response ───┤         │
   │<──── HTML + React ───┤                       │
   │       (rendered)     │                       │
```

### 2. Docker Push/Pull (v2 API)

```
Docker Client          Go Server              Storage
   │                      │                       │
   ├─ PUT /v2/repo/manifests/tag ───────>│       │
   │                      │                       │
   │                      ├──── Save to storage ──────>│
   │                      │<──── Success ─────────┤
   │<──── 201 Created ────┤                       │
```

## Technology Stack

### Frontend
- **React 18.2** - UI framework
- **React Router 6.20** - Client-side routing
- **Vite 5.0** - Build tool
- **Vanilla CSS** - Styling (no framework dependency)

### Backend
- **Go** - Server language
- **Gorilla Mux** - HTTP router
- **Embedded FS** - Static file serving (`//go:embed`)

### Storage (No Database!)
- **Filesystem** - Local storage
- **S3/Azure/GCS** - Cloud storage
- **Redis (Optional)** - Blob metadata cache only

## Why No Database?

✅ **Simpler Architecture**
- Fewer dependencies
- Easier deployment
- Less maintenance

✅ **Better Performance**
- Direct storage access
- No database overhead
- Optional caching with Redis

✅ **Stateless Design**
- Easy horizontal scaling
- Cloud-native friendly
- Kubernetes compatible

## Development Workflow

### Frontend Development
```bash
cd frontend
npm install        # Install React, Vite, etc.
npm run dev        # Start dev server (localhost:5173)
                   # Hot reload on changes
                   # Proxy API to localhost:5000
```

### Build for Production
```bash
npm run build      # Vite bundles React app
                   # Output: ../registry/api/web/static/
                   #   - index.html
                   #   - assets/index-[hash].js
                   #   - assets/index-[hash].css
```

### Embed in Go Binary
```bash
cd ..
make binaries      # Go build with //go:embed directive
                   # Frontend is now part of registry binary
                   # No separate web server needed!
```

## File Size Comparison

### Before (Plain HTML/JS)
- `index.html` - ~6 KB

### After (React Build)
- `index.html` - ~500 bytes (loader)
- `index-[hash].js` - ~150 KB (React + app)
- `index-[hash].css` - ~3 KB (styles)

Total: ~153 KB (minified + gzipped ~50 KB)

Still very lightweight!

## Advantages of This Architecture

✅ **Single Binary Deployment**
- Everything in one executable
- No separate frontend server
- Easy to deploy

✅ **No Build-Time Coupling**
- Frontend and backend developed independently
- React built separately
- Clean separation of concerns

✅ **Production Ready**
- Optimized builds
- Code splitting possible
- CDN friendly (static assets)

✅ **Developer Friendly**
- Hot reload during development
- Fast builds with Vite
- Modern React patterns

✅ **Backward Compatible**
- Docker v2 API unchanged
- Existing clients work as before
- Web UI is optional feature
