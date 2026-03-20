'use client'
import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { apiFetch } from '@/lib/api'

// ─── Small helper: a labelled input ──────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />
    </div>
  )
}

// ─── A card that wraps each settings section ─────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ─── Save button that shows feedback ─────────────────────────────────────────
function SaveButton({ onClick, saving, status }) {
  const label = saving ? 'Saving…'
    : status === 'ok'  ? '✅ Saved!'
    : status === 'err' ? '❌ Error'
    : 'Save Changes'

  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/50 text-white font-medium py-3 rounded-lg transition-all"
    >
      {label}
    </button>
  )
}

// =============================================================================
export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()

  // ── Profile section ─────────────────────────────────────────────────────
  const [name,    setName]    = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameStatus, setNameStatus] = useState(null)  // null | 'ok' | 'err'
  const [nameError,  setNameError]  = useState('')

  // ── Email section ────────────────────────────────────────────────────────
  const [email,   setEmail]   = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailError,  setEmailError]  = useState('')

  // ── Password section ─────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwStatus,   setPwStatus]   = useState(null)
  const [pwError,    setPwError]    = useState('')

  // ── Artist name section (existing feature) ───────────────────────────────
  const [defaultArtist,  setDefaultArtist]  = useState('')
  const [artistSaving,   setArtistSaving]   = useState(false)
  const [artistStatus,   setArtistStatus]   = useState(null)

  // Seed from session & load settings on mount
  useEffect(() => {
    if (!session?.token) return

    // Pre-fill name and email from the JWT session
    if (session.user?.name)  setName(session.user.name)
    if (session.user?.email) setEmail(session.user.email)

    // Load default artist name from the /settings endpoint
    apiFetch('/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.defaultArtistName) {
          setDefaultArtist(data.settings.defaultArtistName)
        }
      })
      .catch(() => {})
  }, [session?.token])

  // ── Generic helper that calls PATCH /auth/me ────────────────────────────
  async function patchMe(body) {
    const res = await apiFetch('/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Update failed')

    // If the server returned a new token, tell NextAuth to refresh the session
    if (data.token) {
      await updateSession({ token: data.token, user: data.user })
    }
    return data
  }

  // ── Save name ────────────────────────────────────────────────────────────
  async function saveName() {
    setNameSaving(true); setNameError(''); setNameStatus(null)
    try {
      await patchMe({ name })
      setNameStatus('ok')
    } catch (err) {
      setNameError(err.message)
      setNameStatus('err')
    } finally {
      setNameSaving(false)
      setTimeout(() => setNameStatus(null), 3000)
    }
  }

  // ── Save email ───────────────────────────────────────────────────────────
  async function saveEmail() {
    setEmailSaving(true); setEmailError(''); setEmailStatus(null)
    try {
      await patchMe({ email })
      setEmailStatus('ok')
    } catch (err) {
      setEmailError(err.message)
      setEmailStatus('err')
    } finally {
      setEmailSaving(false)
      setTimeout(() => setEmailStatus(null), 3000)
    }
  }

  // ── Save password ────────────────────────────────────────────────────────
  async function savePassword() {
    setPwError(''); setPwStatus(null)
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    try {
      await patchMe({ currentPassword: currentPw, newPassword: newPw })
      setPwStatus('ok')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwError(err.message)
      setPwStatus('err')
    } finally {
      setPwSaving(false)
      setTimeout(() => setPwStatus(null), 3000)
    }
  }

  // ── Save default artist name ─────────────────────────────────────────────
  async function saveArtist() {
    setArtistSaving(true); setArtistStatus(null)
    try {
      await apiFetch('/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultArtistName: defaultArtist }),
      })
      setArtistStatus('ok')
    } catch {
      setArtistStatus('err')
    } finally {
      setArtistSaving(false)
      setTimeout(() => setArtistStatus(null), 3000)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">⚙️ Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* ── Display Name ─────────────────────────────────────────────── */}
        <Card title="Display Name">
          <Field
            label="Your name"
            value={name}
            onChange={setName}
            placeholder="e.g. DJ Example"
            autoComplete="name"
          />
          {nameError && <p className="text-red-400 text-sm mb-3">{nameError}</p>}
          <SaveButton onClick={saveName} saving={nameSaving} status={nameStatus} />
        </Card>

        {/* ── Email Address ─────────────────────────────────────────────── */}
        <Card title="Email Address">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {emailError && <p className="text-red-400 text-sm mb-3">{emailError}</p>}
          <SaveButton onClick={saveEmail} saving={emailSaving} status={emailStatus} />
        </Card>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <Card title="Change Password">
          <Field
            label="Current password"
            type="password"
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <Field
            label="New password"
            type="password"
            value={newPw}
            onChange={setNewPw}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
          {pwError && <p className="text-red-400 text-sm mb-3">{pwError}</p>}
          <SaveButton onClick={savePassword} saving={pwSaving} status={pwStatus} />
        </Card>

        {/* ── Default Artist Name (existing feature) ───────────────────── */}
        <Card title="Default Artist Name">
          <p className="text-xs text-gray-500 mb-3">
            Pre-fills the artist field on every new upload. You can always change it per track.
          </p>
          <Field
            label="Artist name"
            value={defaultArtist}
            onChange={setDefaultArtist}
            placeholder="Your Artist Name"
          />
          <SaveButton onClick={saveArtist} saving={artistSaving} status={artistStatus} />
        </Card>

      </div>
    </div>
  )
}
