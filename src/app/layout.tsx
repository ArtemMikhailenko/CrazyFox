import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "CrazyFox ($CFOX) | The Wildest Meme Coin on BSC 🦊🚀",
    template: "%s | CrazyFox - Revolutionary Meme Coin"
  },
  description: "Join the CrazyFox revolution! 🦊 The most exciting meme coin on Binance Smart Chain with 500K+ community members, epic tokenomics, and moon-bound potential. Buy $CFOX now and become part of the fox pack! 🚀💎",
  keywords: [
    "CrazyFox",
    "CFOX",
    "meme coin",
    "cryptocurrency",
    "Binance Smart Chain",
    "BSC",
    "DeFi",
    "moon coin",
    "fox token",
    "crypto community",
    "diamond hands",
    "to the moon",
    "meme token",
    "crypto investment",
    "blockchain",
    "decentralized finance",
    "hodl",
    "crypto fox",
    "BSC token",
    "pancakeswap"
  ],
  authors: [
    {
      name: "CrazyFox Team",
      url: "https://www.crazy-fox.io/"
    }
  ],
  creator: "CrazyFox Development Team",
  publisher: "CrazyFox",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.crazy-fox.io/'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'es-ES': '/es-ES',
      'zh-CN': '/zh-CN',
      'ja-JP': '/ja-JP',
      'ko-KR': '/ko-KR',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.crazy-fox.io/',
    siteName: 'CrazyFox - Revolutionary Meme Coin',
    title: 'CrazyFox ($CFOX) | The Wildest Meme Coin Revolution 🦊🚀',
    description: '🦊 Join 500K+ foxes in the craziest crypto community! CrazyFox ($CFOX) is the most exciting meme coin on BSC with epic tokenomics, amazing roadmap, and moon potential. Buy $CFOX now! 🚀💎',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CrazyFox - The Wildest Meme Coin on BSC',
        type: 'image/png',
      },
      {
        url: '/og-image.png',
        width: 1080,
        height: 1080,
        alt: 'CrazyFox Logo - $CFOX Token',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@CrazyFoxBSC',
    creator: '@CrazyFoxBSC',
    title: 'CrazyFox ($CFOX) | The Wildest Meme Coin Revolution 🦊🚀',
    description: '🦊 Join the fox pack! 500K+ community members, epic tokenomics, and moon-bound potential. The craziest meme coin on BSC! Buy $CFOX now! 🚀💎 #CrazyFox #CFOX #MemeCoin #BSC',
    images: {
      url: '/og-image.png',
      alt: 'CrazyFox - Revolutionary Meme Coin on BSC',
      width: 1200,
      height: 600,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon-57x57.png',
        sizes: '57x57',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-60x60.png',
        sizes: '60x60',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-76x76.png',
        sizes: '76x76',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-114x114.png',
        sizes: '114x114',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-120x120.png',
        sizes: '120x120',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        url: '/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#ff6b35',
      },
      {
        rel: 'shortcut icon',
        url: '/favicon.ico',
      },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    // Custom meta tags for better SEO and social sharing
    'theme-color': '#ff6b35',
    'msapplication-TileColor': '#ff6b35',
    'msapplication-TileImage': '/mstile-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    
    // Crypto-specific meta tags
    'crypto:symbol': 'CFOX',
    'crypto:network': 'BSC',
    'crypto:contract': '0x742d35Cc7cF66f5e8f20A4C1b8c4A6b8b4E6F5d1C2',
    
    // Social media meta tags
    'fb:app_id': '1234567890',
    'telegram:channel': '@CrazyFoxBSC',
    'discord:server': 'CrazyFox Community',
    
    // Additional SEO tags
    'rating': 'general',
    'distribution': 'global',
    'revisit-after': '1 days',
    'language': 'en',
    'geo.region': 'US',
    'geo.placename': 'Global',
    'classification': 'Cryptocurrency, Meme Coin, DeFi, Blockchain',
    
    // Mobile app tags
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'CrazyFox',
    
    // Preconnect and DNS prefetch for performance
    'dns-prefetch': 'https://fonts.googleapis.com',
    'preconnect': 'https://fonts.gstatic.com',
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      'coinmarketcap-id': 'your-cmc-id',
      'coingecko-id': 'your-coingecko-id',
    },
  },
  category: 'Cryptocurrency',
  classification: 'Meme Coin, DeFi, Blockchain Technology',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fox-full.png" as="image" type="image/png" />
        <link rel="preload" href="/fox.png" as="image" type="image/png" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Additional meta tags for crypto and meme coin SEO */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Rich snippets and structured data will be added via JSON-LD in page components */}
        
        {/* Performance hints */}
        <link rel="dns-prefetch" href="//bscscan.com" />
        <link rel="dns-prefetch" href="//pancakeswap.finance" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Referrer policy for privacy */}
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        {children}
        
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "WebSite"],
              "name": "CrazyFox",
              "alternateName": "CFOX",
              "description": "The wildest meme coin on Binance Smart Chain with revolutionary tokenomics and an amazing community of 500K+ members.",
              "url": "https://crazyfox.io",
              "logo": "https://crazyfox.io/fox.png",
              "image": "https://crazyfox.io/og-image.png",
              "sameAs": [
                "https://twitter.com/CrazyFoxBSC",
                "https://t.me/CrazyFoxBSC",
                "https://discord.gg/crazyfox",
                "https://youtube.com/@CrazyFoxBSC",
                "https://instagram.com/crazyfoxbsc",
                "https://tiktok.com/@crazyfoxbsc"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["English", "Spanish", "Chinese", "Japanese", "Korean"]
              },
              "foundingDate": "2024",
              "keywords": "meme coin, cryptocurrency, BSC, DeFi, CrazyFox, CFOX",
              "mainEntity": {
                "@type": "FinancialProduct",
                "name": "CrazyFox Token",
                "alternateName": "CFOX",
                "description": "Revolutionary meme coin on Binance Smart Chain",
                "category": "Cryptocurrency",
                "provider": {
                  "@type": "Organization",
                  "name": "CrazyFox"
                }
              }
            })
          }}
        />
      </body>
    </html>
  );
}