'use client'

import { useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'

/**
 * Reusable file attachments widget.
 *
 * Props:
 *  - filesUrl  (string) Full API URL for the files collection endpoint
 *              e.g.  `${API_BASE_URL}/releases/${id}/promo/${pid}/files`
 *              POST  → upload a new file
 *              GET   /:filename  → download
 *              DELETE /:filename → delete
 *  - files     (array)  Current file list: [{ filename, size, uploadedAt }]
 *  - onFilesChange (fn) Called with new file array after upload/delete
 *  - title     (string) Optional section title
 *  - description (string) Optional description below title
 */
export default function FileAttachments({
  filesUrl,
  files = [],
  onFilesChange,
  title = 'Files',
  description = 'Upload any related documents (contracts, stems, marketing material, etc.)',
}) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading]   = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [deletingFile, setDeletingFile] = useState(null) // filename being deleted

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await apiFetch(filesUrl, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onFilesChange(data.documents || [])
    } catch (err) {
      alert(`Failed to upload: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Download (authenticated blob) ─────────────────────────────────────────

  const handleDownload = async (filename) => {
    try {
      const res = await apiFetch(`${filesUrl}/${encodeURIComponent(filename)}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Failed to download: ${err.message}`)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}? This cannot be undone.`)) return
    setDeletingFile(filename)
    try {
      const res  = await apiFetch(`${filesUrl}/${encodeURIComponent(filename)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      onFilesChange(data.documents || [])
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setDeletingFile(null)
    }
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">

      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-default ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
            onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]) }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <p className="text-gray-400 text-sm">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">📎</div>
              <p className="text-gray-300 text-sm">Drag and drop files here</p>
              <p className="text-gray-500 text-xs">or</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-500">PDF · DOC · DOCX · TXT · JPG · PNG · ZIP</p>
            </div>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {files.length} uploaded file{files.length !== 1 ? 's' : ''}
            </p>
            {files.map(doc => (
              <div
                key={doc.filename}
                className="flex items-center gap-3 px-4 py-3 bg-gray-900/60 rounded-lg border border-gray-700/60 group"
              >
                {/* Icon */}
                <span className="text-lg flex-shrink-0">
                  {/\.(pdf)$/i.test(doc.filename) ? '📄'
                    : /\.(docx?|txt)$/i.test(doc.filename) ? '📝'
                    : /\.(jpe?g|png|gif|webp)$/i.test(doc.filename) ? '🖼️'
                    : /\.zip$/i.test(doc.filename) ? '🗜️'
                    : '📎'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm font-medium truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(doc.size)}{doc.uploadedAt ? ` · ${formatDate(doc.uploadedAt)}` : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc.filename)}
                    className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-lg transition-all"
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.filename)}
                    disabled={deletingFile === doc.filename}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-lg transition-all disabled:opacity-40"
                    title="Delete"
                  >
                    {deletingFile === doc.filename ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
