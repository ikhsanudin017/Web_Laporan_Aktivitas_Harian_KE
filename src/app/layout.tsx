import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KSU KE - Sistem Laporan Aktivitas',
  description: 'Aplikasi web modern untuk laporan aktivitas harian marketing funding KSU Karya Efektif',
  keywords: 'KSU, laporan, aktivitas, marketing, funding, koperasi',
  authors: [{ name: 'KSU Karya Efektif' }],
  creator: 'KSU Karya Efektif',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-yellow-50 relative">
          {/* Islamic Geometric Background Pattern */}
          <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
            <div className="absolute inset-0"></div>
          </div>
          
          {/* Main Content with Islamic styling */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Floating geometric elements */}
          <div className="fixed top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full animate-bounce hidden lg:block opacity-20"></div>
          <div className="fixed bottom-20 right-10 w-16 h-16 bg-green-200 rounded-lg rotate-45 animate-pulse hidden lg:block opacity-20"></div>
          <div className="fixed top-1/2 right-20 w-12 h-12 bg-green-300 rounded-full animate-ping hidden xl:block opacity-20"></div>
        </div>
      </body>
    </html>
  )
}
