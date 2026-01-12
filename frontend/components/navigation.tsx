'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container, Package, Settings } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard', icon: Container },
    { href: '/repositories', label: 'Repositories', icon: Package },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-8 h-16">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
