'use client'
// app/register/page.js — Register page
// Matches login page style. POSTs to backend, then signs in via NextAuth.

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (res.status === 409) {
        setError('An account with this email already exists')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Registration successful — sign in via NextAuth, then redirect
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but sign-in failed. Please log in manually.')
        setLoading(false)
        return
      }

      // Hard redirect so Edge middleware sees the fresh session cookie immediately
      window.location.href = '/'
    } catch (err) {
      setError('Registration failed. Please try again.')
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
          <h1 className="text-2xl font-bold text-gray-100">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">Your private music catalogue</p>
        </div>

        {/* Register card */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="hover:text-gray-400">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
        </p>

      </div>
    </div>
  )
}
