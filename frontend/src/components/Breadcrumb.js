'use client'
import Link from 'next/link'

export default function Breadcrumb({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm mb-3">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-gray-500 select-none px-0.5">›</span>
            )}
            {isLast ? (
              <span className="text-white font-medium max-w-[220px] truncate" title={crumb.label}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-400 hover:text-gray-100 transition-colors max-w-[180px] truncate"
                title={crumb.label}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
