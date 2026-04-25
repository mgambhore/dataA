import React, { useState } from 'react'
import { fixAll, fixNulls, fixDuplicates, fixTypes, fixSpelling, exportCsv } from '../utils/api'
import StatBar from '../components/Clean/StatBar'
import IssuesList from '../components/Clean/IssuesList'
import DataPreview from '../components/Clean/DataPreview'

export default function CleanPage({ session, onUpdate }) {
  const [activeTab, setActiveTab] = useState('issues')
  const [loading, setLoading] = useState(null)
  const [appliedFixes, setAppliedFixes] = useState(new Set())

  const run = async (label, fn) => {
    setLoading(label)
    try {
      const { data } = await fn()
      onUpdate({
        report: data.report || session.report,
        preview: data.preview || session.preview,
        rows: data.rows || session.rows,
      })
      setAppliedFixes(prev => new Set([...prev, label]))
    } catch (e) {
      alert(e.response?.data?.detail || 'Operation failed')
    } finally {
      setLoading(null)
    }
  }

  const sid = session.session_id
  const report = session.report || {}
  const issues = report.issues || {}

  const totalNulls  = issues.nulls?.total || 0
  const totalDups   = issues.duplicates?.duplicate_rows || 0
  const totalTypes  = issues.type_errors?.total || 0
  const totalSpell  = issues.spelling?.total || 0
  const totalIssues = totalNulls + totalDups + totalTypes + totalSpell
  const score       = report.quality_score || 0

  const actionBtn = (label, fn, color = 'var(--accent)') => (
    <button onClick={() => run(label, fn)} disabled={!!loading}
      style={{
        padding: '9px 18px', background: loading === label ? 'var(--surface2)' : color,
        color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6, opacity: loading && loading !== label ? 0.6 : 1,
      }}>
      {loading === label ? '⏳ Running...' : (appliedFixes.has(label) ? '✓ ' : '') + label}
    </button>
  )

  return (
    <div>
      <StatBar score={score} rows={session.rows} columns={session.columns?.length || 0}
        nulls={totalNulls} duplicates={totalDups} typeErrors={totalTypes} spelling={totalSpell} />

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, transition: 'width .6s',
          background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
          width: totalIssues === 0 ? '100%' : `${Math.round(appliedFixes.size / Math.max(1, 4) * 100)}%`,
        }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {actionBtn('⚡ Fix All', () => fixAll(sid), 'linear-gradient(90deg,var(--accent),var(--accent2))')}
        {actionBtn('Fill Nulls',        () => fixNulls(sid))}
        {actionBtn('Remove Duplicates', () => fixDuplicates(sid))}
        {actionBtn('Fix Types',         () => fixTypes(sid))}
        {actionBtn('Fix Formatting',    () => fixSpelling(sid))}
        <a href={exportCsv(sid)} download style={{
          marginLeft: 'auto', padding: '9px 18px', background: 'var(--success)',
          color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>⬇ Export Clean CSV</a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {['issues', 'preview'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            color: activeTab === t ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
          }}>{t === 'issues' ? `Issues Found (${totalIssues})` : 'Data Preview'}</button>
        ))}
      </div>

      {activeTab === 'issues' && (
        <IssuesList issues={issues} onFixCol={(type, col) => {
          if (type === 'null') run('Fill Nulls', () => fixNulls(sid, 'auto', [col]))
          if (type === 'type') run('Fix Types', () => fixTypes(sid))
          if (type === 'spell') run('Fix Formatting', () => fixSpelling(sid))
        }} />
      )}
      {activeTab === 'preview' && <DataPreview preview={session.preview} columns={session.columns} />}
    </div>
  )
}
