'use client'
// app/reset-password/page.js
// Step 2 of the password reset flow.
// The user arrives here from the link in their email, e.g.:
//   /reset-password?token=abc123...
// We read the token from the URL, show a new-password form,
// and POST it to the backend.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

// ── Inner component (needs useSearchParams, wrapped in Suspense below) ────────
function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') // e.g. "abc123..."

  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState('')

  // If there's no token in the URL, show an error immediately
  const missingToken = !token

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Client-side validation before hitting the server
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── No token in the URL ───────────────────────────────────────────────────
  if (missingToken) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold text-white mb-2">Invalid reset link</h2>
        <p className="text-gray-400 text-sm mb-6">
          This reset link is missing or malformed. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors text-sm"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-lg font-semibold text-white mb-2">Password updated!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors text-sm"
        >
          Go to login
        </Link>
      </div>
    )
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          New password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError('') }}
          placeholder="At least 8 characters"
          required
          autoFocus
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError('') }}
          placeholder="Same password again"
          required
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors shadow-lg"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Remembered it?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Back to login
        </Link>
      </p>

    </form>
  )
}

// ── Page wrapper (Suspense needed because useSearchParams reads the URL) ──────
// Next.js requires this pattern for any component that reads URL params.
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Music Agent"
            className="h-20 w-auto mx-auto mb-4 opacity-90"
          />
          <h1 className="text-2xl font-bold text-gray-100">Set a new password</h1>
          <p className="text-gray-500 text-sm mt-1">Choose something secure</p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
          {/* Suspense is required here because useSearchParams() suspends during SSR */}
          <Suspense fallback={
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

      </div>
    </div>
  )
}
