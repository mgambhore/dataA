import React from 'react'

export default function StatBar({ score, rows, columns, nulls, duplicates, typeErrors, spelling }) {
  const cards = [
    { label: 'Total Rows',    value: rows,       sub: `${columns} columns`, color: '#6366f1' },
    { label: 'Null Values',   value: nulls,      sub: 'missing cells',      color: '#ef4444' },
    { label: 'Duplicates',    value: duplicates, sub: 'duplicate rows',     color: '#8b5cf6' },
    { label: 'Type Errors',   value: typeErrors, sub: 'type mismatches',    color: '#3b82f6' },
    { label: 'Format Issues', value: spelling,   sub: 'spacing / casing',   color: '#f472b6' },
    {
      label: 'Quality Score',
      value: `${score}%`,
      sub: score >= 80 ? '✓ Good' : score >= 50 ? '⚠ Fair' : '✗ Poor',
      color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '14px 16px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: c.color, borderRadius: '12px 0 0 12px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{c.label}</p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
