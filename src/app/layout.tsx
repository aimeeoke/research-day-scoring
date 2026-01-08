import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavigationBar } from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Research Day Scoring System',
  description: 'CVMBS Research Day 2026 - Real-time scoring and winner determination',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-csu-green text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold">
                    Research Day 2026
                  </h1>
                  <span className="ml-3 text-sm text-csu-gold">
                    Scoring System
                  </span>
                </div>
                <NavigationBar />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-gray-500">
                CVMBS Research Day Scoring System • Colorado State University
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
