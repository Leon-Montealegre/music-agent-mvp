'use client';


import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';


export default function FeedbackButton() {
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
        ''
      ];


      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOj0ShJJ8F5u_CzufQbKXyWQ1Ty9GV1X2USOULhGbN_y3dKs63SCklRcAkpwrP6eiu/exec';
      
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: rowData
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
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Send Feedback</h2>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              required
            >
              <option>Bug</option>
              <option>Feature Request</option>
              <option>Suggestion</option>
              <option>Praise</option>
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">
              Current Page <span className="text-gray-400 text-xs">(auto-detected)</span>
            </label>
            <input
              type="text"
              value={displayPage}
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400"
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-32"
              placeholder="Describe the issue or idea..."
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              required
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>


          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
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
