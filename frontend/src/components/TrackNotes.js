'use client';

import { useState, useEffect } from 'react';

export default function TrackNotes({ releaseId, initialNotes = '', initialDocuments = [], onUpdate }) {
  const [notes, setNotes] = useState(initialNotes);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

// Sync state with props when they change
useEffect(() => {
    console.log('📝 Notes prop changed to:', initialNotes);
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // Save notes text
  const handleSaveNotes = async () => {
    setIsSaving(true);
    console.log('💾 Saving notes:', notes);
    
    try {
      const res = await fetch(`http://localhost:3001/releases/${releaseId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
  
      console.log('💾 Response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to save notes');
  
      const data = await res.json();
      console.log('💾 Response data notes:', data.notes);
  
      setSaveMessage('✓ Saved');
      setTimeout(() => setSaveMessage(''), 2000);
      
      // Reload track data
      console.log('💾 Calling onUpdate...');
      if (onUpdate) {
        await onUpdate();
        console.log('💾 onUpdate completed');
      } else {
        console.log('❌ onUpdate not provided!');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };
  

  // Upload document
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`http://localhost:3001/releases/${releaseId}/notes/files`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload file');

      const data = await res.json();
      setDocuments(data.documents || []);
      e.target.value = ''; // Reset input
      
      // Reload track data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/releases/${releaseId}/notes/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete file');

      const data = await res.json();
      setDocuments(data.documents || []);
      
      // Reload track data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  // Download document
  const handleDownloadDocument = (filename) => {
    window.open(`http://localhost:3001/releases/${releaseId}/notes/files/${encodeURIComponent(filename)}`, '_blank');
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center">
          📝 Notes
        </h2>
        <p className="text-sm text-gray-400 mt-1">Add personal notes and documents for this track</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Text Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Track Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this track..."
            rows={6}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {notes.length} characters
            </span>
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm"
            >
              {isSaving ? 'Saving...' : saveMessage || 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Documents */}
        <div className="pt-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Documents</h3>
          
          {/* Document List */}
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
            <p className="text-gray-500 text-sm mb-4">No documents uploaded yet</p>
          )}

          {/* Upload Button */}
          <label className="block w-full">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <div className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm text-center cursor-pointer border-2 border-dashed border-gray-600 hover:border-gray-500">
              {isUploading ? '📤 Uploading...' : '+ Upload Document'}
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Upload any documents related to this track (contracts, stems info, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
