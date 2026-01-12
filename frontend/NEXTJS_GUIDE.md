# Next.js + TypeScript + shadcn/ui Frontend

## Overview

The registry management frontend is now built with **Next.js 14**, **TypeScript**, and **shadcn/ui** components, configured for Static Site Generation (SSG).

## Technology Stack

### Core Framework
- **Next.js 14** - React framework with App Router
- **TypeScript 5.3** - Type-safe development
- **React 18.2** - UI library

### UI & Styling
- **shadcn/ui** - High-quality component library
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **tailwind-merge** - Class name merging

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Dashboard page (/)
│   ├── globals.css              # Global styles + Tailwind
│   ├── repositories/
│   │   └── page.tsx             # Repositories page
│   └── settings/
│       └── page.tsx             # Settings page
│
├── components/
│   ├── navigation.tsx           # Navigation component
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx           # Button with variants
│       └── card.tsx             # Card components
│
├── lib/
│   └── utils.ts                 # Utility functions
│
├── public/                       # Static assets
│
├── next.config.js               # Next.js config (SSG)
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind + shadcn/ui theme
├── postcss.config.js            # PostCSS config
└── package.json                 # Dependencies
```

## Configuration

### Next.js (SSG Mode)

```javascript
// next.config.js
const nextConfig = {
  output: 'export',                      // Enable static export
  distDir: '../registry/api/web/static', // Output directory
  images: { unoptimized: true },         // Required for SSG
  trailingSlash: true,
}
```

### TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Tailwind CSS + shadcn/ui

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        // ... more shadcn/ui colors
      }
    }
  }
}
```

## Components

### shadcn/ui Components

#### Button Component
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:**
- `default` - Primary style
- `destructive` - Danger/delete actions
- `outline` - Outlined button
- `secondary` - Secondary style
- `ghost` - Transparent background
- `link` - Link style

**Sizes:**
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square icon button

#### Card Component
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Custom Components

#### Navigation
```tsx
import Navigation from '@/components/navigation'

<Navigation /> // Auto-highlights active page
```

## Pages

### Dashboard (`app/page.tsx`)
- Displays system status
- Shows repository count
- Quick action buttons
- TypeScript interfaces for API responses

```typescript
interface StatusData {
  status: string
  version: string
  revision: string
  timestamp: string
}
```

### Repositories (`app/repositories/page.tsx`)
- Lists all repositories
- Loading states
- Empty state handling
- Refresh functionality

### Settings (`app/settings/page.tsx`)
- Configuration viewer
- JSON formatted display
- Type-safe config interface

## Development Workflow

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- Hot module replacement
- Fast refresh
- TypeScript checking

### Production Build
```bash
npm run build
```

Generates:
- Static HTML files
- Optimized JavaScript bundles
- CSS files
- Output to `../registry/api/web/static`

### Build Output Structure
```
../registry/api/web/static/
├── _next/
│   ├── static/
│   │   ├── chunks/        # JavaScript chunks
│   │   └── css/           # CSS files
│   └── ...
├── index.html             # Dashboard
├── repositories.html      # Repositories page
└── settings.html          # Settings page
```

## Type Safety

### API Response Types
```typescript
// Status response
interface StatusData {
  status: string
  version: string
  revision: string
  timestamp: string
}

// Repositories response
interface StatsData {
  repositories: string[]
  count: number
}

// Config response
interface ConfigData {
  version: string
  log?: { level: string }
  http?: { addr: string }
  [key: string]: any
}
```

### Component Props
```typescript
// Button props
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Card props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
```

## Styling

### CSS Variables (shadcn/ui)
```css
:root {
  --primary: 251 91% 67%;      /* Purple */
  --secondary: 262 52% 54%;    /* Violet */
  --background: 0 0% 100%;     /* White */
  --foreground: 222.2 84% 4.9%; /* Dark */
  --muted: 210 40% 96.1%;      /* Light gray */
  /* ... more variables */
}
```

### Tailwind Utilities
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Gradient background
<div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background">

// Hover effects
<div className="hover:bg-muted/80 transition-colors">
```

## API Integration

### Fetching Data
```typescript
const [data, setData] = useState<StatusData | null>(null)

const loadData = async () => {
  try {
    const response = await fetch('/api/v1/status')
    if (response.ok) {
      const data = await response.json()
      setData(data)
    }
  } catch (err) {
    setError((err as Error).message)
  }
}

useEffect(() => {
  loadData()
}, [])
```

## Best Practices

### Component Organization
1. Import React and hooks
2. Import UI components
3. Import icons
4. Import custom components
5. Define interfaces
6. Define component

### Type Safety
- Always define interfaces for API responses
- Use TypeScript for all files
- Leverage `React.FC` for function components
- Type event handlers

### Styling
- Use Tailwind utilities
- Leverage shadcn/ui components
- Use CSS variables for theming
- Maintain consistent spacing

### Performance
- Use `'use client'` for interactive components
- Static generation for better performance
- Optimize images (when added)
- Code splitting via Next.js

## Adding New Components

### From shadcn/ui
1. Copy component from shadcn/ui docs
2. Add to `components/ui/[name].tsx`
3. Import and use in pages

Example components to add:
- Alert
- Badge
- Dialog
- Dropdown Menu
- Input
- Label
- Select
- Tabs
- Toast

### Custom Components
1. Create in `components/[name].tsx`
2. Use TypeScript
3. Leverage shadcn/ui components
4. Export as default

## Migration from Vite

### Changes Made
1. ❌ Removed Vite config
2. ❌ Removed JSX files
3. ✅ Added Next.js config
4. ✅ Added TypeScript
5. ✅ Added shadcn/ui components
6. ✅ Converted to TSX
7. ✅ Updated package.json

### Breaking Changes
- None - API integration unchanged
- Same functionality, better implementation

## Benefits

### Developer Experience
- ✅ Type safety throughout
- ✅ Better IDE support
- ✅ Autocomplete everywhere
- ✅ Catch errors at compile time

### Performance
- ✅ Static generation
- ✅ Faster page loads
- ✅ Optimized bundles
- ✅ Better SEO

### UI/UX
- ✅ Consistent design system
- ✅ Accessible components
- ✅ Professional appearance
- ✅ Responsive design

### Maintainability
- ✅ Clear component structure
- ✅ Reusable UI components
- ✅ Easy to extend
- ✅ Well-documented

## Troubleshooting

### TypeScript Errors
```bash
npm run build  # Type checking happens during build
```

### Missing Dependencies
```bash
npm install
```

### Build Failures
Check:
1. TypeScript errors
2. Import paths use `@/` alias
3. All files have proper extensions (.tsx)
4. next.config.js is correct

## Future Enhancements

Potential additions:
- [ ] Dark mode toggle
- [ ] More shadcn/ui components
- [ ] Advanced filtering
- [ ] Search functionality
- [ ] Real-time updates
- [ ] Authentication UI
- [ ] Repository details page
- [ ] Tag management
- [ ] User management

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
