import './globals.css'
import Link from 'next/link'
import ScrollToTop from '@/components/ScrollToTop'
import FeedbackButton from '@/components/FeedbackButton'

export const metadata = {
  title: 'Release Manager',
  description: 'Manage your music releases',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <ScrollToTop />
        
        {/* Global Header with Logo */}
        <header className="bg-gray-800/70 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <img 
                  src="/logo.png" 
                  alt="Your Artist Logo" 
                  className="h-26 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              
              {/* Feedback Button */}
              <FeedbackButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </body>
    </html>
  )
}
