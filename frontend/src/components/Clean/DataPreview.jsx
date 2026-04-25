import React from 'react'

export default function DataPreview({ preview = [], columns = [] }) {
  if (!preview.length) return <p style={{ color: 'var(--muted)', padding: 20 }}>No data to preview.</p>

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background: '#1a1d35', color: 'var(--muted)', width: 48 }}>#</th>
              {columns.map(col => (
                <th key={col} style={{ ...thStyle, background: '#1a1d35', color: '#93c5fd' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e2035' }}>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{i + 1}</td>
                {columns.map(col => {
                  const val = row[col]
                  const isEmpty = val === '' || val === null || val === undefined
                  return (
                    <td key={col} style={{
                      ...tdStyle,
                      color: isEmpty ? '#f59e0b' : 'var(--text)',
                      fontStyle: isEmpty ? 'italic' : 'normal',
                      maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {isEmpty ? '(null)' : String(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12 }}>
        Showing {preview.length} rows · {columns.length} columns
      </div>
    </div>
  )
}

const thStyle = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  position: 'sticky', top: 0, whiteSpace: 'nowrap', fontSize: 12,
}
const tdStyle = { padding: '8px 14px' }
