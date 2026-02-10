import "./globals.css";

export const metadata = {
  title: "Release Management System",
  description: "Track music releases, platform uploads, and label submissions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Header navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">
              🎵 Release Management
            </h1>
          </div>
        </header>

        {/* Page content goes here */}
        <main>{children}</main>
      </body>
    </html>
  );
}