'use client'
// app/login/page.js — Login page
// This is the first thing users see when they're not signed in.
// It calls NextAuth's signIn(), which in turn calls your Express backend.

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()   // prevent page reload
    setLoading(true)
    setError('')

    try {
      // "redirect: false" means NextAuth won't auto-redirect — we handle it ourselves
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        // Login successful — hard redirect so the middleware sees the fresh session cookie
        window.location.href = '/'
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
            className="h-32 w-auto mx-auto mb-4 opacity-90"
          />
          <h1 className="text-2xl font-bold text-gray-100">Sign in to Music Agent</h1>
          <p className="text-gray-500 text-sm mt-1">Your private music catalogue</p>
        </div>

        {/* Login card */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-3 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <Link href="/terms" className="hover:text-gray-400">Terms of Service</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
        </p>

      </div>
    </div>
  )
}
