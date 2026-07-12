import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WHOIS Lookup & Domain Intelligence - The Atom',
  description: 'Instantly inspect domain registration records, RDAP registry outputs, DNS records, SSL certifications, reverse DNS, network ASN, and HTTP server headers.',
  metadataBase: new URL('https://whois.theatom.lk'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'WHOIS Lookup & Domain Intelligence - The Atom',
    description: 'Instantly inspect domain registration records, RDAP, DNS, SSL certs, and security headers.',
    url: 'https://whois.theatom.lk',
    siteName: 'The Atom WHOIS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://whois.theatom.lk/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Atom Domain Intelligence Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WHOIS Lookup & Domain Intelligence - The Atom',
    description: 'Instantly inspect domain registration records, RDAP, DNS, SSL certs, and security headers.',
    images: ['https://whois.theatom.lk/og-image.png']
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured JSON-LD Schemas for GEO and AEO Optimization
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://theatom.lk/#organization',
    'name': 'The Atom',
    'url': 'https://theatom.lk',
    'logo': 'https://theatom.lk/logo.png'
  };

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://whois.theatom.lk/#webapp',
    'name': 'The Atom WHOIS Lookup',
    'url': 'https://whois.theatom.lk',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'All',
    'browserRequirements': 'Requires HTML5 and Javascript',
    'author': {
      '@type': 'Organization',
      'name': 'The Atom'
    },
    'offers': {
      '@type': 'Offer',
      'price': '0.00',
      'priceCurrency': 'USD'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is a WHOIS Lookup?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'A WHOIS lookup is a tool used to inspect domain registration details, containing registrar details, server status codes, nameservers, creation dates, and expiration dates.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What is the Registration Data Access Protocol (RDAP)?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'RDAP is the modern, HTTP-based successor to WHOIS. It delivers standardized domain registration records in JSON format instead of plain text logs.'
        }
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
