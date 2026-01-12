import React, { useState, useEffect } from 'react'

function Repositories() {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setError('Failed to load repositories: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRepositories()
  }, [])

  if (loading) {
    return <div className="loading">Loading repositories...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Repositories ({repositories.length})</h2>
        <button className="btn" onClick={loadRepositories}>
          Refresh
        </button>
      </div>

      {repositories.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
          No repositories found. Push an image to get started.
        </p>
      ) : (
        <ul className="repo-list">
          {repositories.map((repo, index) => (
            <li key={index} className="repo-item">
              <div>
                <div className="repo-name">{repo}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Repositories
