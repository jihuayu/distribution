# React Frontend Overview

## Application Structure

The web management interface is now a complete **React 18** application with the following features:

### Components

1. **App.jsx** - Main Application
   - React Router setup
   - Navigation component
   - Route definitions

2. **Dashboard.jsx** - Home Page
   - System status display (version, revision)
   - Repository statistics
   - Quick action buttons
   - Auto-refreshing data

3. **Repositories.jsx** - Repository Browser
   - List all repositories
   - Repository count
   - Refresh functionality
   - Empty state handling

4. **Settings.jsx** - Configuration Viewer
   - Display sanitized config
   - JSON formatted output
   - Version and log level display

### Routes

- `/` - Dashboard (default page)
- `/repositories` - Repository list
- `/settings` - Configuration viewer

### Technology Stack

- **React 18.2** - UI framework
- **React Router 6.20** - Client-side routing
- **Vite 5.0** - Build tool and dev server
- **Modern CSS** - Responsive grid layouts

### Features

✅ **Modern React Patterns**
- Functional components
- React Hooks (useState, useEffect)
- Async data fetching
- Error boundaries
- Loading states

✅ **Developer Experience**
- Hot Module Replacement (HMR)
- Fast build times with Vite
- Proxy configuration for API calls
- Source maps for debugging

✅ **User Experience**
- Responsive design
- Loading indicators
- Error messages
- Smooth navigation
- Clean, modern UI

## Development Workflow

### 1. Install Dependencies
```bash
cd frontend
npm install
```

This installs:
- react@18.2.0
- react-dom@18.2.0
- react-router-dom@6.20.0
- @vitejs/plugin-react@4.2.1
- vite@5.0.8

### 2. Start Development Server
```bash
npm run dev
```

This starts Vite dev server at `http://localhost:5173` with:
- Hot Module Replacement
- Automatic proxy to backend (localhost:5000)
- Fast compilation

### 3. Build for Production
```bash
npm run build
```

This:
- Bundles all React code
- Minifies JavaScript and CSS
- Outputs to `../registry/api/web/static`
- Creates optimized production build

### 4. Embed in Registry
```bash
cd ..
make binaries
```

The Go build embeds the frontend using `//go:embed static` directive.

## File Structure

```
frontend/
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── index.html            # HTML entry point
├── README.md             # Frontend documentation
├── .gitignore           # Ignore node_modules and dist
│
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # Main app with routing
    ├── index.css        # Global styles
    │
    └── components/
        ├── Dashboard.jsx    # Dashboard page
        ├── Repositories.jsx # Repository list page
        └── Settings.jsx     # Settings page
```

## Code Examples

### Dashboard Component
```jsx
function Dashboard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/v1/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .finally(() => setLoading(false))
  }, [])
  
  return (
    <div className="card">
      <h2>System Status</h2>
      {/* Display status data */}
    </div>
  )
}
```

### Routing Setup
```jsx
<Router>
  <Navigation />
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/repositories" element={<Repositories />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Router>
```

## UI Screenshots

When you run the application, you'll see:

1. **Header** - Registry title and subtitle
2. **Navigation** - Dashboard, Repositories, Settings tabs
3. **Content Area** - Dynamic based on route
4. **Cards** - Information displayed in styled cards
5. **Buttons** - Action buttons with hover effects

## Benefits of React Implementation

✅ **Component Reusability** - Easy to add new pages
✅ **State Management** - Clean data flow with hooks
✅ **Fast Development** - Hot reload during development
✅ **Better UX** - Client-side routing, no page reloads
✅ **Maintainable** - Clear separation of concerns
✅ **Extensible** - Easy to add features like authentication
✅ **Modern Stack** - Industry-standard tools

## Next Steps

To extend the frontend:

1. **Add Authentication UI**
   - Login page component
   - Protected routes
   - Session management

2. **Add More Features**
   - Tag browser for repositories
   - Image manifest viewer
   - Real-time notifications
   - Upload/download metrics

3. **Enhance UI**
   - Add a component library (Material-UI, Ant Design)
   - Dark mode toggle
   - Advanced filtering
   - Search functionality

## Comparison: Before vs After

### Before (Plain HTML/JS)
- ❌ No routing (single page only)
- ❌ Manual DOM manipulation
- ❌ No hot reload
- ❌ Difficult to extend
- ❌ No component structure

### After (React)
- ✅ Full routing with React Router
- ✅ Declarative UI with components
- ✅ Hot Module Replacement
- ✅ Easy to add pages and features
- ✅ Clean component architecture
