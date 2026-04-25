import React, { useEffect, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement, Title, Filler,
} from 'chart.js'
import { getDashboard, exportCsv } from '../utils/api'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Filler)

const COLORS = ['#6366f1','#22d3ee','#f472b6','#f59e0b','#10b981','#ef4444','#8b5cf6','#3b82f6']

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e2035' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e2035' } },
  },
  responsive: true, maintainAspectRatio: false,
}

export default function DashboardPage({ session }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard(session.session_id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session.session_id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div><p>Loading dashboard...</p>
    </div>
  )

  if (!data) return <p style={{ color: 'var(--muted)', padding: 20 }}>Failed to load dashboard data.</p>

  const q = data.quality || {}
  const score = q.score || 0

  return (
    <div>
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Quality Score', value: `${score}%`, color: score >= 80 ? '#10b981' : '#f59e0b' },
          { label: 'Clean Rows', value: session.rows, color: '#6366f1' },
          { label: 'Columns', value: session.columns?.length, color: '#22d3ee' },
          { label: 'Nulls Remaining', value: q.nulls || 0, color: q.nulls > 0 ? '#ef4444' : '#10b981' },
          { label: 'Duplicates', value: q.duplicates || 0, color: q.duplicates > 0 ? '#8b5cf6' : '#10b981' },
          { label: 'Type Errors', value: q.type_errors || 0, color: q.type_errors > 0 ? '#3b82f6' : '#10b981' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: c.color }} />
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{c.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Export button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <a href={exportCsv(session.session_id)} download style={{
          padding: '9px 20px', background: '#10b981', color: '#fff',
          borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>⬇ Export Clean CSV</a>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16 }}>

        {/* Quality Donut */}
        <ChartCard title="Data Quality Overview">
          <CustomLegend items={[{ label: `Clean (${score}%)`, color: '#10b981' }, { label: `Issues (${100 - score}%)`, color: '#ef4444' }]} />
          <div style={{ height: 220 }}>
            <Doughnut data={{
              labels: ['Clean', 'Issues'],
              datasets: [{ data: [score, 100 - score], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }],
            }} options={{ ...chartDefaults, scales: undefined, cutout: '72%', plugins: { legend: { display: false } } }} />
          </div>
        </ChartCard>

        {/* Column Types */}
        {data.column_types && (
          <ChartCard title="Column Type Distribution">
            <CustomLegend items={Object.keys(data.column_types).map((k, i) => ({ label: `${k}: ${data.column_types[k]}`, color: COLORS[i] }))} />
            <div style={{ height: 220 }}>
              <Doughnut data={{
                labels: Object.keys(data.column_types),
                datasets: [{ data: Object.values(data.column_types), backgroundColor: COLORS.slice(0, Object.keys(data.column_types).length), borderWidth: 0 }],
              }} options={{ ...chartDefaults, scales: undefined, cutout: '65%', plugins: { legend: { display: false } } }} />
            </div>
          </ChartCard>
        )}

        {/* Null by column */}
        {data.null_by_column?.labels?.length > 0 && (
          <ChartCard title="Null Values by Column">
            <div style={{ height: Math.max(200, data.null_by_column.labels.length * 38 + 40) }}>
              <Bar data={{
                labels: data.null_by_column.labels,
                datasets: [{ data: data.null_by_column.values, backgroundColor: '#f59e0b88', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 4 }],
              }} options={{ ...chartDefaults, indexAxis: 'y' }} />
            </div>
          </ChartCard>
        )}

        {/* Row completeness */}
        {data.row_completeness && (
          <ChartCard title="Row Completeness">
            <div style={{ height: 220 }}>
              <Bar data={{
                labels: Object.keys(data.row_completeness),
                datasets: [{ data: Object.values(data.row_completeness), backgroundColor: ['#ef444488', '#f59e0b88', '#3b82f688', '#10b98188'], borderRadius: 6, borderWidth: 0 }],
              }} options={{ ...chartDefaults }} />
            </div>
          </ChartCard>
        )}

        {/* Issues breakdown */}
        <ChartCard title="Issues Breakdown">
          <CustomLegend items={[
            { label: `Nulls: ${q.nulls || 0}`, color: '#f59e0b' },
            { label: `Duplicates: ${q.duplicates || 0}`, color: '#8b5cf6' },
            { label: `Type Errors: ${q.type_errors || 0}`, color: '#3b82f6' },
            { label: `Format: ${q.spelling || 0}`, color: '#f472b6' },
          ]} />
          <div style={{ height: 200 }}>
            <Bar data={{
              labels: ['Nulls', 'Duplicates', 'Type Errors', 'Format'],
              datasets: [{ data: [q.nulls || 0, q.duplicates || 0, q.type_errors || 0, q.spelling || 0],
                backgroundColor: ['#f59e0b88', '#8b5cf688', '#3b82f688', '#f472b688'],
                borderColor: ['#f59e0b', '#8b5cf6', '#3b82f6', '#f472b6'],
                borderWidth: 1, borderRadius: 6 }],
            }} options={{ ...chartDefaults }} />
          </div>
        </ChartCard>

        {/* Numeric distributions */}
        {Object.entries(data.numeric_stats || {}).map(([col, stats]) => (
          <ChartCard key={col} title={`Distribution: ${col}`}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              {[['Min', stats.min], ['Max', stats.max], ['Mean', stats.mean], ['Median', stats.median]].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</p>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 180 }}>
              <Bar data={{
                labels: stats.histogram?.labels || [],
                datasets: [{ data: stats.histogram?.values || [], backgroundColor: '#6366f188', borderColor: '#6366f1', borderWidth: 1, borderRadius: 3 }],
              }} options={{ ...chartDefaults }} />
            </div>
          </ChartCard>
        ))}

        {/* Categorical value counts */}
        {Object.entries(data.categorical_counts || {}).map(([col, counts]) => (
          <ChartCard key={col} title={`Value Counts: ${col}`}>
            <div style={{ height: Math.max(200, counts.labels.length * 34 + 40) }}>
              <Bar data={{
                labels: counts.labels,
                datasets: [{ data: counts.values, backgroundColor: '#22d3ee66', borderColor: '#22d3ee', borderWidth: 1, borderRadius: 3 }],
              }} options={{ ...chartDefaults, indexAxis: 'y' }} />
            </div>
          </ChartCard>
        ))}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  )
}

function CustomLegend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
      {items.map(({ label, color }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          {label}
        </span>
      ))}
    </div>
  )
}
