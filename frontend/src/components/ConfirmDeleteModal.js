'use client'

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, itemName }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">{title || 'Confirm Delete'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            {message || 'Are you sure you want to delete this item?'}
          </p>
          
          {itemName && (
            <div className="bg-gray-900/50 p-3 rounded-lg mb-6 border border-gray-700">
              <p className="text-gray-200 font-medium break-all">{itemName}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

