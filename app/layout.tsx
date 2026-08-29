import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const oswald = Oswald({ subsets: ['latin'], variable: '--font-sans' })
const inter = Inter({ subsets: ['latin'], variable: '--font-serif' })

const siteUrl = 'https://nunex-cortes.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nunex Cortes | Barbearia do Nuno',
    template: '%s | Nunex Cortes',
  },
  description:
    'Agende seu corte com o Nuno na Nunex Cortes. Barbearia com agendamento online, horários disponíveis em tempo real e atendimento com hora marcada.',
  keywords: [
    'Nunex Cortes',
    'Barbearia do Nuno',
    'barbearia',
    'agendamento barbearia',
    'corte masculino',
    'barbeiro Nuno',
  ],
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'EpSNr28JlNw7dxy846ntDpsfV9QQ0M4DNjfswu7tV-s',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Nunex Cortes',
    title: 'Nunex Cortes | Barbearia do Nuno',
    description:
      'Agende seu corte com o Nuno online. Escolha o dia e o horário disponível e confirme sua reserva.',
  },
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
