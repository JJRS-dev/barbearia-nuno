import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const oswald = Oswald({ subsets: ['latin'], variable: '--font-sans' })
const inter = Inter({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Nunex Cortes | Barbearia do Nuno',
  description:
    'Agende seu corte com o Nuno na Nunex Cortes. Escolha o dia, o horário e garanta seu visual.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1a1a1d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`dark ${oswald.variable} ${inter.variable}`}>
      <body className="bg-background font-serif antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
