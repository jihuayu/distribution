import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Repositories from './components/Repositories'
import Settings from './components/Settings'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        Dashboard
      </Link>
      <Link to="/repositories" className={location.pathname === '/repositories' ? 'active' : ''}>
        Repositories
      </Link>
      <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
        Settings
      </Link>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="container">
        <div className="header">
          <h1>🐳 Registry Management</h1>
          <p className="subtitle">Modern Container Registry Dashboard</p>
        </div>
        
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repositories" element={<Repositories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
