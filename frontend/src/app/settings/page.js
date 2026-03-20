'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [defaultArtist, setDefaultArtist] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!session?.token) return
    apiFetch('/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.defaultArtistName) {
          setDefaultArtist(data.settings.defaultArtistName)
        }
      })
  }, [session])

  async function handleSave() {
    await apiFetch('/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultArtistName: defaultArtist })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* ✅ Header with back button — matches your other pages */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-100">⚙️ Settings</h1>
          </div>
          <p className="text-gray-300">Manage your default preferences</p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Default Artist Name
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Pre-fills the artist field on every new upload. You can always change it per track.
          </p>
          <input
            type="text"
            value={defaultArtist}
            onChange={e => setDefaultArtist(e.target.value)}
            placeholder="Your Artist Name"
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
          />
          <button
            onClick={handleSave}
            className="w-full bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white font-medium py-3 rounded-lg transition-all"
          >
            {saved ? '✅ Saved!' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  )
}
