import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFile } from '../utils/api'

export default function UploadPage({ onUpload }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    setError(null)
    setLoading(true)
    try {
      const { data } = await uploadFile(file)
      onUpload(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) handleFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
    disabled: loading,
  })

  return (
    <div style={{ maxWidth: 680, margin: '48px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8,
          background: 'linear-gradient(90deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Upload Your Dataset
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>
          Supports CSV and Excel files. Get instant quality analysis, cleaning tools, and a visual dashboard.
        </p>
      </div>

      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16, padding: '64px 40px', textAlign: 'center', cursor: 'pointer',
        background: isDragActive ? '#1e2040' : 'var(--surface)',
        transition: 'all .3s', marginBottom: 24,
      }}>
        <input {...getInputProps()} />
        {loading ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Analyzing your file...</p>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>Detecting nulls, types, duplicates, and formatting issues</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isDragActive ? '📥' : '📂'}</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {isDragActive ? 'Drop it here!' : 'Drag & drop your CSV or Excel file'}
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>or click to browse your computer</p>
            <span style={{
              padding: '10px 28px', background: 'var(--accent)', color: '#fff',
              borderRadius: 8, fontSize: 14, fontWeight: 600,
            }}>Browse File</span>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 20 }}>
              Supports .csv · .xlsx · .xls — max 10 MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: 10, padding: '12px 16px', color: '#fca5a5', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--muted)' }}>WHAT WE ANALYZE</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['🔍 Null Detection', 'Finds empty, N/A, and undefined values'],
            ['♻️ Duplicates', 'Identifies exact duplicate rows'],
            ['🔢 Type Checking', 'Detects mixed types and format errors'],
            ['✏️ Spelling Fix', 'Trims whitespace, fixes casing'],
            ['📈 Statistics', 'Min, max, mean, std for numeric cols'],
            ['📊 Dashboard', 'Power BI-style charts and insights'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>{title.split(' ')[0]}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title.slice(3)}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
