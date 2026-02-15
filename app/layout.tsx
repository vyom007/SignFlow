import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

import '@/lib/env' // validate required env vars at startup
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SignFlow - eSignature Platform',
  description: 'Professional document signing made simple. Upload, send, and track signatures with enterprise-grade security.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
