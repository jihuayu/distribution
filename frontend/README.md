# Registry Management Frontend

React-based frontend for the Distribution Registry management interface.

## Development

Install dependencies:
```bash
cd frontend
npm install
```

Start development server:
```bash
npm run dev
```

The development server will proxy API requests to `http://localhost:5000`.

## Building

Build for production:
```bash
npm run build
```

This builds the React app and outputs to `../registry/api/web/static`, where it will be embedded in the Go binary.

## Structure

- `src/App.jsx` - Main application with routing
- `src/components/Dashboard.jsx` - Dashboard with status and stats
- `src/components/Repositories.jsx` - Repository listing
- `src/components/Settings.jsx` - Configuration viewer

## Features

- **Dashboard**: View registry status, version, and repository count
- **Repositories**: Browse all repositories in the registry
- **Settings**: View registry configuration (sanitized)
- **Responsive Design**: Works on desktop and mobile
- **React Router**: Client-side routing for single-page app experience

## API Integration

The frontend consumes these API endpoints:
- `GET /api/v1/status` - Registry status
- `GET /api/v1/repositories` - Repository list
- `GET /api/v1/config` - Configuration (sanitized)
- `GET /api/v1/health` - Health check
