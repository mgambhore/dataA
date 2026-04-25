import React from 'react'

const Chip = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 4,
    background: color + '22', color: color, border: `1px solid ${color}44`,
  }}>{label}</span>
)

export default function IssuesList({ issues, onFixCol }) {
  const nullByCols  = issues?.nulls?.by_column || {}
  const dupInfo     = issues?.duplicates || {}
  const typeByCols  = issues?.type_errors?.by_column || {}
  const spellByCols = issues?.spelling?.by_column || {}

  const allCols = new Set([
    ...Object.keys(nullByCols).filter(c => nullByCols[c].count > 0),
    ...Object.keys(typeByCols),
    ...Object.keys(spellByCols),
  ])

  const hasAnyIssue = allCols.size > 0 || dupInfo.duplicate_rows > 0

  if (!hasAnyIssue) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>All issues resolved!</p>
        <p style={{ marginTop: 8 }}>Head to the Dashboard to explore your clean data.</p>
      </div>
    )
  }

  const fixBtn = (label, onClick) => (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
      background: 'transparent', color: 'var(--muted)', fontSize: 12,
      marginRight: 6, marginTop: 6, transition: 'all .2s',
    }}
      onMouseOver={e => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#fff' }}
      onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--muted)' }}>
      {label}
    </button>
  )

  return (
    <div>
      {/* Duplicates */}
      {dupInfo.duplicate_rows > 0 && (
        <div style={{ background: '#1e1b4b33', border: '1px solid #312e81', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Chip label="DUPLICATES" color="#8b5cf6" />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              {dupInfo.duplicate_rows} duplicate rows found ({dupInfo.duplicate_percent}% of data)
            </span>
          </div>
          {fixBtn('Remove Duplicates', () => onFixCol('dup', null))}
        </div>
      )}

      {/* Per-column issues */}
      {[...allCols].map(col => {
        const nullInfo  = nullByCols[col]
        const typeInfo  = typeByCols[col]
        const spellInfo = spellByCols[col]
        return (
          <div key={col} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#a5b4fc' }}>{col}</span>
              {nullInfo?.count > 0 && <Chip label={`${nullInfo.count} null`} color="#f59e0b" />}
              {typeInfo && <Chip label="type error" color="#3b82f6" />}
              {spellInfo && <Chip label={`${spellInfo.length} format`} color="#f472b6" />}
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.8 }}>
              {nullInfo?.count > 0 && (
                <div>◆ Null at rows: {(nullInfo.rows || []).slice(0, 5).map(r => r + 1).join(', ')}
                  {(nullInfo.rows || []).length > 5 ? '...' : ''}</div>
              )}
              {typeInfo?.errors?.map((e, i) => (
                <div key={i}>◆ Type error: "{e}" is not numeric</div>
              ))}
              {(spellInfo || []).slice(0, 3).map((s, i) => (
                <div key={i}>◆ {s.type}: "{s.value?.slice(0, 40)}" (row {s.row + 1})</div>
              ))}
            </div>

            <div>
              {nullInfo?.count > 0 && fixBtn('Fill Nulls', () => onFixCol('null', col))}
              {typeInfo && fixBtn('Fix Types', () => onFixCol('type', col))}
              {spellInfo && fixBtn('Fix Formatting', () => onFixCol('spell', col))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
