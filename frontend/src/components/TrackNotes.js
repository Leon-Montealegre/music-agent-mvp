'use client';

import { useState, useEffect } from 'react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export default function TrackNotes({
  releaseId,
  initialNotes = '',
  initialDocuments = [],
  onUpdate,
  baseUrl, // optional override — if not provided, falls back to release endpoint
  notesPlaceholder,
  fileCardTitle,
  hideFiles = false  // set to true when a separate FileAttachments component replaces the files card
}) {
  const [notes, setNotes]         = useState(initialNotes);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isSaving, setIsSaving]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Derive the API base — works for both releases and collections
  const apiBase = baseUrl || `${API_BASE_URL}/releases/${releaseId}`

  useEffect(() => { setNotes(initialNotes) },     [initialNotes])
  useEffect(() => { setDocuments(initialDocuments) }, [initialDocuments])

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`${apiBase}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error('Failed to save notes');
      setSaveMessage('✓ Saved');
      setTimeout(() => setSaveMessage(''), 2000);
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch(`${apiBase}/notes/files`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload file');
      const data = await res.json();
      setDocuments(data.documents || []);
      e.target.value = '';
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const res = await apiFetch(`${apiBase}/notes/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete file');
      const data = await res.json();
      setDocuments(data.documents || []);
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleDownloadDocument = (filename) => {
    window.open(`${apiBase}/notes/files/${encodeURIComponent(filename)}`, '_blank');
  };

  return (
    <>
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            Notes
          </h2>
          <p className="text-sm text-gray-400 mt-1">Add personal notes</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={notesPlaceholder || 'Add any notes about the track, e.g. collaborators...'}
              rows={6}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{notes.length} characters</span>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm"
              >
                {isSaving ? 'Saving...' : saveMessage || 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!hideFiles && <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">
            {fileCardTitle || 'Files'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">Upload and manage related files</p>
        </div>

        <div className="p-6">
          {documents.length > 0 ? (
            <div className="space-y-2 mb-4">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDownloadDocument(doc.filename)}
                      className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.filename)}
                      className="text-sm px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No files uploaded yet</p>
          )}

          <label className="block w-full">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <div className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm text-center cursor-pointer border-2 border-dashed border-gray-600 hover:border-gray-500">
              {isUploading ? '📤 Uploading...' : '+ Upload File'}
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Upload any related documents (contracts, stems info, etc.)
          </p>
        </div>
      </div>}
    </>
  );
}
