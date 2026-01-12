# Registry Management Frontend

Next.js-based frontend with TypeScript, shadcn/ui, and Static Site Generation (SSG) for the Distribution Registry management interface.

## Technology Stack

- **Next.js 14** - React framework with SSG support
- **TypeScript** - Type-safe development
- **shadcn/ui** - High-quality UI components built with Radix UI and Tailwind CSS
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

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

Access at `http://localhost:3000`. API requests will need the registry server running on `localhost:5000`.

## Building

Build for production (Static Site Generation):
```bash
npm run build
```

This generates a static export in `../registry/api/web/static`, which is embedded in the Go binary.

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx            # Dashboard page (/)
│   ├── globals.css         # Global styles with Tailwind
│   ├── repositories/
│   │   └── page.tsx        # Repositories page
│   └── settings/
│       └── page.tsx        # Settings page
├── components/
│   ├── navigation.tsx      # Navigation component
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   └── utils.ts           # Utility functions (cn)
├── public/                # Static assets
├── next.config.js         # Next.js configuration (SSG mode)
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Features

- **Dashboard**: View registry status, version, and repository count
- **Repositories**: Browse all repositories in the registry
- **Settings**: View registry configuration (sanitized)
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Full TypeScript support
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Static Export**: Optimized static HTML/CSS/JS for embedding

## API Integration

The frontend consumes these API endpoints from the registry:
- `GET /api/v1/status` - Registry status and version
- `GET /api/v1/repositories` - Repository list
- `GET /api/v1/config` - Configuration (sanitized)
- `GET /api/v1/health` - Health check

## Configuration

### Next.js Configuration (`next.config.js`)

```javascript
const nextConfig = {
  output: 'export',                    // Enable static export
  distDir: '../registry/api/web/static', // Output to registry static dir
  images: {
    unoptimized: true,                // Required for static export
  },
}
```

### Tailwind Configuration

Includes shadcn/ui theme with custom colors, animations, and components.

## Adding shadcn/ui Components

To add more shadcn/ui components, manually add them to `components/ui/` following the shadcn/ui documentation pattern.

Example components included:
- Button
- Card (with Header, Title, Description, Content, Footer)

## Development Notes

- Uses Next.js App Router (not Pages Router)
- Client-side data fetching with React hooks
- Static generation means no server-side rendering at runtime
- All pages are pre-rendered at build time

## Production Build

The production build generates:
- `_next/static/` - Static assets (JS, CSS)
- `*.html` - Pre-rendered HTML pages
- Optimized and minified assets

These are embedded into the Go registry binary using `//go:embed`.
