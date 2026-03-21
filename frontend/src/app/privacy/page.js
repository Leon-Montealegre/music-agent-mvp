import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Music Agent',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <Link href="/login" className="text-sm text-purple-400 hover:text-purple-300">
            ← Back
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-100 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">1. What data we collect</h2>
            <p>When you create an account we collect your name and email address. When you use the app, we store the releases, collections, files, and other catalogue data you choose to enter. We also store the files you upload (audio, artwork, documents) in Cloudflare R2 cloud storage.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">2. How we use your data</h2>
            <p>Your data is used solely to provide the Music Agent service to you. We use your email address to send password reset emails (via Resend) when you request them. We do not use your data for marketing, analytics, or any other purpose, and we do not sell or share it with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">3. Data storage</h2>
            <p>Your account data is stored in a PostgreSQL database hosted on Railway. Your uploaded files are stored in Cloudflare R2 object storage. Both services are located in the EU. Your data is stored securely and is only accessible to you and the app administrator.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">4. Cookies and sessions</h2>
            <p>Music Agent uses a single session cookie to keep you logged in. This cookie contains an encrypted token and no personal information. It expires after 30 days or when you log out.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">5. Your rights</h2>
            <p>You can update your name, email, and password at any time in your account settings. You can request deletion of your account and all associated data by contacting us via the Feedback button in the app. We will action deletion requests within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">6. Changes to this policy</h2>
            <p>We may update this policy from time to time. Continued use of Music Agent after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">7. Contact</h2>
            <p>Questions about your data? Reach out via the Feedback button in the app.</p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex gap-6 text-sm text-gray-600">
          <Link href="/terms" className="hover:text-gray-400">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
        </div>

      </div>
    </div>
  )
}
