import './globals.css'
import Link from 'next/link'
import ScrollToTop from '@/components/ScrollToTop'
import FeedbackButton from '@/components/FeedbackButton'

export const metadata = {
  title: 'Music Agent',
  description: 'Manage your music catalogue',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <ScrollToTop />
        
        <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <img 
                  src="/logo.png" 
                  alt="Music Agent Logo" 
                  className="h-26 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              
              <div className="flex items-center gap-3">
                <FeedbackButton />
                
                <a
                  href="https://www.buymeacoffee.com/musicagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md hover:shadow-lg border border-orange-500/20"
                >
                  <span className="text-base">☕</span>
                  <span>Buy me a coffee</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}