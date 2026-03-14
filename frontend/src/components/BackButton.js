'use client'
import Link from 'next/link'

export default function BackButton({ href = '/', label = 'Back' }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
    >
      <span>←</span>
      <span>{label}</span>
    </Link>
  )
}
