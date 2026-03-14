'use client'
import Link from 'next/link'

export default function BackButton({ href = '/' }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium shadow-md border border-purple-500/20"
    >
      ←
    </Link>
  )
}
