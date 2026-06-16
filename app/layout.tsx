import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'IDOL.NULL // cosmic horror survivor',
  description: 'Multiplayer prediction market survival horror simulation',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-[13px] leading-tight">
        <div id="crt" />
        <Nav />
        {children}
      </body>
    </html>
  )
}
