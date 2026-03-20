'use client'
// app/forgot-password/page.js
// Step 1 of the password reset flow.
// The user enters their email and we tell them to check their inbox.

import { useState } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false) // true once the form is sent
  const [error,     setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        // Show the success state regardless — even if the email isn't registered
        // (the backend always returns 200 to prevent email enumeration)
        setSubmitted(true)
      }
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Music Agent"
            className="h-20 w-auto mx-auto mb-4 opacity-90"
          />
          <h1 className="text-2xl font-bold text-gray-100">Forgot your password?</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">

          {/* ── Success state ─────────────────────────────────────────────── */}
          {submitted ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-lg font-semibold text-white mb-2">Check your inbox</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                If that email address is registered, you&apos;ll receive a reset link
                shortly. The link expires in <strong className="text-gray-200">1 hour</strong>.
              </p>
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                ← Back to login
              </Link>
            </div>

          ) : (

            /* ── Form state ─────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  required
                  autoFocus
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
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <p className="text-center text-gray-400 text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </p>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}
