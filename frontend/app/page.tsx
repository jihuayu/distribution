'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Activity, GitCommit } from 'lucide-react'
import Navigation from '@/components/navigation'

interface StatusData {
  status: string
  version: string
  revision: string
  timestamp: string
}

interface StatsData {
  repositories: string[]
  count: number
}

export default function HomePage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch('/api/v1/status'),
        fetch('/api/v1/repositories'),
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      setError('Failed to load data: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">🐳 Registry Management</h1>
            <p className="text-muted-foreground">Modern Container Registry Dashboard</p>
          </div>
          <Navigation />
          <div className="mt-8 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading dashboard data...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">🐳 Registry Management</h1>
            <p className="text-muted-foreground">Modern Container Registry Dashboard</p>
          </div>
          <Navigation />
          <Card className="mt-8 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">🐳 Registry Management</h1>
          <p className="text-muted-foreground">Modern Container Registry Dashboard</p>
        </div>

        <Navigation />

        <div className="mt-8 space-y-6">
          {status && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>Current registry status and version information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                    <div className="text-2xl font-bold capitalize">{status.status || 'unknown'}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
                    <div className="text-2xl font-bold">{status.version || 'N/A'}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                      <GitCommit className="mr-1 h-3 w-3" />
                      Revision
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {status.revision ? status.revision.substring(0, 7) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Repository Statistics</CardTitle>
                <CardDescription>Overview of repositories in the registry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Total Repositories
                    </div>
                    <div className="text-2xl font-bold">{stats.count || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage and monitor your registry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={loadData} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
                <Button variant="outline" onClick={() => window.open('/api/v1/config', '_blank')}>
                  View Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
