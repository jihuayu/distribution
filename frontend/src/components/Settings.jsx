import React, { useState, useEffect } from 'react'

function Settings() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        setError('Failed to load configuration: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (loading) {
    return <div className="loading">Loading configuration...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="card">
      <h2>Registry Configuration</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        View-only configuration (sensitive data is hidden)
      </p>

      {config && (
        <div>
          <div className="info-item" style={{ marginBottom: '15px' }}>
            <div className="info-label">Version</div>
            <div className="info-value">{config.version}</div>
          </div>

          {config.log && (
            <div className="info-item" style={{ marginBottom: '15px' }}>
              <div className="info-label">Log Level</div>
              <div className="info-value">{config.log.level}</div>
            </div>
          )}

          {config.http && (
            <div className="info-item" style={{ marginBottom: '15px' }}>
              <div className="info-label">HTTP Address</div>
              <div className="info-value">{config.http.addr}</div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#667eea', marginBottom: '15px' }}>Configuration JSON</h3>
            <pre style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '5px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
