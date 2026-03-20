'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function AdminButton() {
  const { data: session } = useSession()

  if (!session?.user?.isAdmin) return null

  return (
    <Link
      href="/admin"
      style={{ height: '36px' }}
      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors font-medium shadow-md border border-purple-500/50"
    >
      <span className="text-base">🛡️</span>
      <span>Admin</span>
    </Link>
  )
}
