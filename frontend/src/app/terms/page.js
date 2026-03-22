import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Music Agent',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-100 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">1. What Music Agent is</h2>
            <p>Music Agent is a private catalogue management tool for music artists. It lets you track your releases, manage distribution submissions, store files, and monitor the status of your music across platforms. Access is by invitation only.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">2. Your account</h2>
            <p>You are responsible for keeping your login credentials secure. You must not share your account with others or use it for any purpose other than managing your own music catalogue. We reserve the right to suspend or remove accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">3. Your content</h2>
            <p>You retain full ownership of all music, artwork, and other files you upload. By uploading content, you confirm that you have the right to store it here. We do not claim any ownership over your content and will not share it with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">4. Acceptable use</h2>
            <p>You agree not to use Music Agent to store or distribute illegal content, infringe on the rights of others, or attempt to gain unauthorised access to the system or other users' data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">5. Service availability</h2>
            <p>We aim to keep Music Agent available at all times but cannot guarantee uninterrupted access. We are not liable for any data loss or downtime. We recommend keeping your own backups of important files.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">6. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of Music Agent after changes are posted constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">7. Contact</h2>
            <p>Questions? Reach out via the Feedback button in the app.</p>
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
