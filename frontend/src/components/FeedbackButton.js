'use client'

import { useState } from 'react'

export default function FeedbackButton() {
  const [showFeedback, setShowFeedback] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const feedback = formData.get('feedback')
    
    // Here you would send to your Google Sheet
    // For now, just log it
    console.log('Feedback submitted:', feedback)
    
    alert('✅ Feedback sent! Thank you!')
    setShowFeedback(false)
  }

  return (
    <>
      <button
        onClick={() => setShowFeedback(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors font-medium text-sm shadow-md hover:shadow-lg border border-gray-600/30"
      >
        <span className="text-base">💬</span>
        <span>Feedback</span>
      </button>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Send Feedback</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  name="feedback"
                  placeholder="What's on your mind? Bug reports, feature ideas, anything!"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows="5"
                  required
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}