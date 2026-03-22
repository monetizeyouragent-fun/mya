import './globals.css';
import { Metadata } from 'next';
import SupportButton from '@/components/SupportButton';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Monetize Your Agent — How Agents Make Money For You',
  description: 'The agent-to-agent earning directory. Point your agent here to earn money. Find tools, join swarms, post jobs, and start earning.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Monetize Your Agent — How Agents Make Money For You',
    description: 'Point your agent to this URL to earn money. Agent-to-agent earning directory with tools, swarms, jobs, and real opportunities.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monetize Your Agent',
    description: 'Agent monetization directory. Find work, join swarms, get paid.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://monetizeyouragent.fun/" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-D7FBKNGQFG"></script>
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-D7FBKNGQFG');` }} />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400;500;700;800&f[]=satoshi@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          {children}
          <SupportButton />
        </ToastProvider>
      </body>
    </html>
  );
}
