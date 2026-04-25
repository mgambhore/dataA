import React from 'react'

export default function Navbar({ page, setPage, hasSession }) {
  const tabs = [
    { key: 'upload', label: '📂 Upload' },
    { key: 'clean',  label: '🧹 Clean',     disabled: !hasSession },
    { key: 'dashboard', label: '📊 Dashboard', disabled: !hasSession },
  ]

  return (
    <header style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 32px', display: 'flex', alignItems: 'center', gap: 24, height: 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 16, background: 'linear-gradient(90deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DataClean Pro
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => !t.disabled && setPage(t.key)}
            disabled={t.disabled}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid',
              borderColor: page === t.key ? 'var(--accent)' : 'transparent',
              background: page === t.key ? 'var(--surface2)' : 'transparent',
              color: t.disabled ? 'var(--border)' : page === t.key ? 'var(--text)' : 'var(--muted)',
              fontSize: 13, fontWeight: page === t.key ? 600 : 400,
              cursor: t.disabled ? 'not-allowed' : 'pointer', transition: 'all .2s',
            }}>
            {t.label}
          </button>
        ))}
      </nav>

      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
        Full-Stack Data Cleaning Dashboard
      </div>
    </header>
  )
}
