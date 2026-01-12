# Registry Management Frontend

Next.js-based frontend with TypeScript and shadcn/ui for the Distribution Registry management interface.

## Quick Start

```bash
cd frontend
npm install
npm run dev     # Development server at localhost:3000
npm run build   # Production build
```

## Stack

- **Next.js 15** - React framework with SSG
- **TypeScript** - Type safety
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling

## Structure

```
app/
├── page.tsx              # Dashboard
├── repositories/         # Repository browser
└── settings/             # Configuration viewer

components/
├── navigation.tsx        # Navigation
└── ui/                   # shadcn/ui components
```

## API Endpoints

- `/api/v1/status` - Registry status
- `/api/v1/repositories` - Repository list
- `/api/v1/config` - Configuration
- `/api/v1/health` - Health check

## Building

The build outputs to `../registry/api/web/static` and is embedded in the Go binary.

```bash
npm run build
cd ..
make binaries
```
