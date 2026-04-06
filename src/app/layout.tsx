import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import NavBar from '@/components/NavBar'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'VetApp — PatasYColas',
  description: 'Sistema de gestión veterinaria con autenticación basada en roles (RBAC)',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <NavBar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
