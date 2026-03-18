'use client'

import { useSession, signOut } from 'next-auth/react'

export default function UserPill() {
  const { data: session, status } = useSession()

  if (status === 'loading' || !session) {
    return null
  }

  const initial = session.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : '?'

  return (
    <div
      style={{ height: '36px' }}
      className="flex items-center gap-2 px-3 rounded-lg bg-gray-700 border border-gray-600/50 text-gray-300"
    >
      <span
        className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-sm font-medium"
        aria-hidden
      >
        {initial}
      </span>
      <span className="text-sm font-medium">{session.user?.name ?? 'User'}</span>
      <span className="text-gray-500">|</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        Log out
      </button>
    </div>
  )
}
