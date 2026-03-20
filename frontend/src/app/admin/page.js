'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'

// Format a date string into something readable, e.g. "20 Mar 2026"
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Which user ID is pending confirmation for deletion
  const [confirmId, setConfirmId] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  // ── Load users ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.token) return
    loadUsers()
  }, [session?.token])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Delete a user ────────────────────────────────────────────────────────
  async function deleteUser(userId) {
    setDeleting(true)
    try {
      const res  = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      // Remove from local list without refetching
      setUsers(prev => prev.filter(u => u.id !== userId))
      setConfirmId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  // ── Guard: must be logged in + admin ────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-400">This page is restricted to administrators.</p>
        </div>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">🛡️ Admin Panel</h1>
          <p className="text-gray-400">Manage all user accounts</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Users table card */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No users found.</div>
          ) : (
            users.map(user => {
              const isSelf    = user.id === session.user?.id
              const isPending = confirmId === user.id

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-700/50 last:border-0 items-center transition-colors ${
                    isPending ? 'bg-red-900/20' : 'hover:bg-gray-700/30'
                  }`}
                >
                  {/* Name */}
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-300 flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-gray-100 text-sm truncate">
                      {user.name || <span className="text-gray-500 italic">No name</span>}
                      {isSelf && <span className="ml-2 text-xs text-purple-400">(you)</span>}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="col-span-4 text-gray-300 text-sm truncate">{user.email}</div>

                  {/* Joined */}
                  <div className="col-span-2 text-gray-400 text-sm">{formatDate(user.created_at)}</div>

                  {/* Role badge */}
                  <div className="col-span-1">
                    {user.is_admin ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600/40 text-purple-300 border border-purple-500/50">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600/40 text-gray-400 border border-gray-500/50">
                        User
                      </span>
                    )}
                  </div>

                  {/* Delete control */}
                  <div className="col-span-1 flex justify-end">
                    {isSelf ? null : !isPending ? (
                      <button
                        onClick={() => setConfirmId(user.id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={deleting}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50"
                        >
                          {deleting ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* User count */}
        {!loading && (
          <p className="mt-4 text-right text-xs text-gray-600">
            {users.length} {users.length === 1 ? 'user' : 'users'} total
          </p>
        )}

      </div>
    </div>
  )
}
