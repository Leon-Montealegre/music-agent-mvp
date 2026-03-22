import './globals.css'
import Link from 'next/link'
import ScrollToTop from '@/components/ScrollToTop'
import MobileMenu from '@/components/MobileMenu'
import Providers from '@/components/Providers'


export const metadata = {
  title: 'Music Agent',
  description: 'Track your music releases, manage distribution submissions, and monitor your catalogue — all in one place.',
  metadataBase: new URL('https://musicagentchigui.com'),
  openGraph: {
    title: 'Music Agent',
    description: 'Track your music releases, manage distribution submissions, and monitor your catalogue — all in one place.',
    url: 'https://musicagentchigui.com',
    siteName: 'Music Agent',
    images: [{ url: '/logo.png', alt: 'Music Agent' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Music Agent',
    description: 'Track your music releases, manage distribution submissions, and monitor your catalogue — all in one place.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
  },
}


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <Providers>
        <ScrollToTop />

        <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50 shadow-xl relative">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <img
                  src="/logo.png"
                  alt="Music Agent Logo"
                  className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>

              <MobileMenu />
            </div>
          </div>
        </header>


        {children}
        </Providers>
      </body>
    </html>
  )
}
