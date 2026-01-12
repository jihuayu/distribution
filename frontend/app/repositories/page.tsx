'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Package } from 'lucide-react'
import Navigation from '@/components/navigation'

interface Repository {
  name: string
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRepositories = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/repositories')

      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories || [])
      } else {
        setError('Failed to load repositories')
      }
    } catch (err) {
      setError('Failed to load repositories: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRepositories()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">🐳 Registry Management</h1>
          <p className="text-muted-foreground">Modern Container Registry Dashboard</p>
        </div>

        <Navigation />

        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Repositories ({repositories.length})
                  </CardTitle>
                  <CardDescription>Browse all repositories in the registry</CardDescription>
                </div>
                <Button onClick={loadRepositories} disabled={loading} variant="outline" size="sm">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading repositories...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">{error}</div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No repositories found. Push an image to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {repositories.map((repo, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">{repo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
