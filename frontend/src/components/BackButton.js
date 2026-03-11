import Link from 'next/link'

export default function BackButton({ href = '/', label = 'Back to Catalogue' }) {
  return (
    <Link href={href} className="text-purple-400 hover:text-purple-300 transition-colors">
      ← {label}
    </Link>
  )
}
