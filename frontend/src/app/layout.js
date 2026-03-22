import './globals.css'
import ScrollToTop from '@/components/ScrollToTop'
import ConditionalHeader from '@/components/ConditionalHeader'
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

        <ConditionalHeader />


        {children}
        </Providers>
      </body>
    </html>
  )
}
