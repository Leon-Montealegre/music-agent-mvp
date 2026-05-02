'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';

export default function FeedbackButton() {
  const {  session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Bug',
    description: '',
    priority: 'Medium'
  });

  const currentPage = typeof window !== 'undefined' ? window.location.pathname : '';
  const displayPage = currentPage === '/' ? 'Home / Catalogue' : currentPage;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const timestamp = new Date().toLocaleString();
      const rowData = [
        timestamp,
        formData.type,
        displayPage,
        formData.description,
        formData.priority,
        'New',
        '',
        session?.user?.name || '',
        session?.user?.email || ''
      ];

      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOj0ShJJ8F5u_CzufQbKXyWQ1Ty9GV1X2USOULhGbN_y3dKs63SCklRcAkpwrP6eiu/exec';

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           rowData
        })
      });

      alert('Feedback submitted! Thank you!');
      setFormData({ type: 'Bug', description: '', priority: 'Medium' });
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = isOpen && (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-100">💬 Send Feedback</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option>Bug</option>
              <option>Feature Request</option>
              <option>Suggestion</option>
              <option>Praise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Current Page <span className="text-gray-500 text-xs font-normal">(auto-detected)</span>
            </label>
            <input
              type="text"
              value={displayPage}
              readOnly
              className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-lg px-3 py-2 cursor-default"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe the issue or idea..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ minHeight: '36px', height: '36px' }}
        className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg border border-gray-600/30"
      >
        💬 Feedback
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
