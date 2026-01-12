'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon } from 'lucide-react'
import Navigation from '@/components/navigation'

interface ConfigData {
  version: string
  log?: {
    level: string
  }
  http?: {
    addr: string
  }
  [key: string]: any
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/v1/config')

        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        } else {
          setError('Failed to load configuration')
        }
      } catch (err) {
        setError('Failed to load configuration: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
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
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Registry Configuration
              </CardTitle>
              <CardDescription>
                View-only configuration (sensitive data is hidden)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading configuration...</div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">{error}</div>
              ) : config ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Version</div>
                    <div className="text-lg font-semibold">{config.version}</div>
                  </div>

                  {config.log && (
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Log Level</div>
                      <div className="text-lg font-semibold">{config.log.level}</div>
                    </div>
                  )}

                  {config.http && (
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm font-medium text-muted-foreground mb-1">HTTP Address</div>
                      <div className="text-lg font-semibold">{config.http.addr}</div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Configuration JSON</h3>
                    <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm font-mono">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
