import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import '@/styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Lillian MacKinney',
  description: 'Original works by Lillian MacKinney — paintings, charcoal, and ink on paper.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable}`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
