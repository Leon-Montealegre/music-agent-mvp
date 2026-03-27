'use client'
import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
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

  // ── Delete account section ────────────────────────────────────────────────
  const [showDeleteModal,   setShowDeleteModal]   = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting,          setDeleting]          = useState(false)
  const [deleteError,       setDeleteError]       = useState('')

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

    // If the server returned a new token, tell NextAuth to refresh the session.
    // We pass flat values (name, email, token) because the jwt callback reads
    // them directly from the `session` argument during a trigger === 'update'.
    if (data.token) {
      await updateSession({
        name:  data.user.name,
        email: data.user.email,
        token: data.token,
      })
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

  // ── Delete account ───────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await apiFetch('/auth/me', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      // Sign out and redirect to home — account is gone
      await signOut({ callbackUrl: '/' })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
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
            placeholder="e.g. Sophie Joe"
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

        {/* ── Legal ────────────────────────────────────────────────────── */}
        <Card title="Legal">
          <p className="text-xs text-gray-500 mb-4">
            Review the terms and privacy policy you agreed to when creating your account.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
              Terms of Service
            </a>
            <span className="text-gray-700">·</span>
            <a href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
              Privacy Policy
            </a>
          </div>
        </Card>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400 text-lg">⚠️</span>
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            <strong className="text-red-300">This action is permanent and cannot be undone.</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Deleting your account will permanently remove <strong className="text-gray-400">everything</strong> — your profile, all releases, collections, uploaded files, artwork, notes, and distribution records. There is no recovery option.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
            className="px-4 py-2 bg-red-700/60 hover:bg-red-600 border border-red-600/60 text-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            Delete my account and all data
          </button>
        </div>

      </div>
    </div>

    {/* ── Delete Account Confirmation Modal ─────────────────────────────── */}
    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="bg-gray-900 border border-red-800/60 rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-400">Delete your account?</h2>
          </div>

          <div className="bg-red-950/50 border border-red-800/40 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-sm text-red-200 font-medium">This will permanently delete:</p>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Your account and login credentials</li>
              <li>All releases and collections</li>
              <li>All uploaded audio, video, and artwork files</li>
              <li>All notes, documents, and distribution records</li>
            </ul>
            <p className="text-sm text-red-300 font-medium pt-1">
              This cannot be reversed. There is no backup.
            </p>
          </div>

          <p className="text-sm text-gray-400 mb-2">
            To confirm, type <strong className="text-white font-mono">DELETE MY ACCOUNT</strong> below:
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="w-full px-3 py-2 mb-4 border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
            autoComplete="off"
          />

          {deleteError && (
            <p className="text-red-400 text-sm mb-4">{deleteError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleting}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete everything'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
