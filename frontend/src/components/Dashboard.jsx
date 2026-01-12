import React, { useState, useEffect } from 'react'

function Dashboard() {
  const [status, setStatus] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch('/api/v1/status'),
        fetch('/api/v1/repositories')
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
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <>
      {status && (
        <div className="card">
          <h2>System Status</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">{status.status || 'unknown'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Version</div>
              <div className="info-value">{status.version || 'N/A'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Revision</div>
              <div className="info-value">{status.revision ? status.revision.substring(0, 7) : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="card">
          <h2>Repository Statistics</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Total Repositories</div>
              <div className="info-value">{stats.count || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ marginTop: '20px' }}>
          <button className="btn" onClick={loadData}>
            Refresh Data
          </button>
          <button className="btn btn-secondary" onClick={() => window.open('/api/v1/config', '_blank')}>
            View Config
          </button>
        </div>
      </div>
    </>
  )
}

export default Dashboard
