import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Study Agent App',
  description: 'A Next.js app with Supabase and Anthropic integration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
