import React, { useState } from 'react'
import UploadPage from './pages/UploadPage'
import CleanPage from './pages/CleanPage'
import DashboardPage from './pages/DashboardPage'
import Navbar from './components/Navbar'

export default function App() {
  const [page, setPage] = useState('upload')
  const [session, setSession] = useState(null) // { session_id, filename, rows, columns, report, preview }

  const handleUpload = (data) => {
    setSession(data)
    setPage('clean')
  }

  const handleSessionUpdate = (updates) => {
    setSession(prev => ({ ...prev, ...updates }))
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar page={page} setPage={setPage} hasSession={!!session} />
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {page === 'upload' && <UploadPage onUpload={handleUpload} />}
        {page === 'clean' && session && (
          <CleanPage session={session} onUpdate={handleSessionUpdate} />
        )}
        {page === 'dashboard' && session && (
          <DashboardPage session={session} />
        )}
        {(page === 'clean' || page === 'dashboard') && !session && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <p>Please upload a file first</p>
            <button onClick={() => setPage('upload')} style={{
              marginTop: 16, padding: '10px 24px', background: 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14
            }}>Go to Upload</button>
          </div>
        )}
      </main>
    </div>
  )
}
