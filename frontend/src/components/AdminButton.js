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
      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all font-medium border border-amber-500/40 hover:border-amber-400/70 hover:shadow-md hover:shadow-amber-500/20"
    >
      <span className="text-base">🛡️</span>
      <span>Admin</span>
    </Link>
  )
}
