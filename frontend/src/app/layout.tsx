import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Avoid overused fonts - using carefully selected alternatives
const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Iceberg Method — Bottom-Up Revenue Scaling for Shopify DTC Brands',
  description: '≥20% revenue lift in 90 days. Fix lifecycle, funnel, and CRO before scaling paid acquisition. Built for bootstrapped Shopify brands.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="font-sans antialiased bg-ice-950 text-ice-100">
        {children}
      </body>
    </html>
  )
}
