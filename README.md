<div align="center">
  <img src="public/logo.svg" alt="WHOIS Lookup Logo" width="400" height="96" />
</div>

<br />

<div align="center">
<strong>Free, Real-Time Domain Intelligence & WHOIS Investigation Tool</strong>
</div>

<br />

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<br />

<a href="https://whois.theatom.lk">
<img src="https://img.shields.io/badge/View%20Live%20Demo-Click%20Here-0071e3?style=for-the-badge&logo=safari&logoColor=white" height="50" />
</a>

<br />
<br />

**[Visit Live Site: https://whois.theatom.lk](https://whois.theatom.lk)**

</div>

<br />

> **"Every domain tells a story — you just need to know how to read it."**
>
> WHOIS Lookup isn't just another domain checker; it's a complete domain intelligence platform.  
> Powered by real-time WHOIS, RDAP, DNS, and SSL data, it transforms a simple domain name into a comprehensive investigation report.

---

## 🌟 Vision

WHOIS Lookup aims to be:

- **A completely free domain intelligence tool** — no paywalls, no subscriptions, ever
- **A real-time investigation platform** using live WHOIS, RDAP, DNS, and SSL data
- **A beautiful, modern web application** with clean, minimal design

---

## ✨ Why WHOIS Lookup?

Traditional domain lookup tools are cluttered, slow, and often paywall critical data.  
WHOIS Lookup democratizes domain investigation by making **every lookup, every record, and every detail 100% free**.

---

## 🎨 Clean, Minimal Design

- **Minimalist Aesthetics**  
  Pure CSS Modules implementation with a clean, focused design language — no heavy frameworks, just elegance.

- **Glass Morphism Effects**  
  Translucent overlays with `backdrop-filter: blur()` create depth and focus on key content.

- **Soft Elevation**  
  Subtle shadows and smooth transitions provide a premium feel.

- **System Typography**  
  Native Inter font family with Caveat signature accents for maximum legibility.

---

## 🔍 Comprehensive Domain Intelligence

- **WHOIS Lookup**  
  Raw TCP WHOIS queries with recursive IANA-to-registry following for complete registration data.

- **RDAP Integration**  
  Modern JSON-based domain registration data from the global RDAP infrastructure.

- **DNS Record Resolution**  
  Complete DNS analysis: A, AAAA, MX, TXT, NS, CAA, SOA, DMARC, SPF, and DNSSEC detection.

- **SSL/TLS Certificate Inspection**  
  Full certificate details: CN, issuer, protocol, cipher, validity dates, and days remaining.

---

## 🔐 Security Analysis

- **HTTP Security Header Grading**  
  Automatic analysis of 6 critical security headers with letter-grade scoring.

- **Redirect Chain Tracking**  
  Visual mapping of up to 5 redirect hops with full URL recording.

- **DNSSEC Detection**  
  Checks for DS records to determine if DNSSEC signing is active.

- **ASN & Hosting Provider Lookup**  
  Team Cymru DNS-based ASN resolution to identify hosting infrastructure.

---

## 📊 Complete Investigation Experience

- **Three View Modes**  
  Dashboard (visual), Raw RDAP JSON, and Raw WHOIS text for different investigation needs.

- **Real-Time Data**  
  All lookups performed live — no cached or stale information.

- **JSON Export**  
  Download complete investigation results as a structured JSON file.

- **Shareable Links**  
  Copy direct links to share investigation results with colleagues.

- **Recent Searches**  
  Local history of your last 5 lookups for quick access.

- **Keyboard Shortcuts**  
  Press `/` to instantly focus the search input.

---

## 📁 Project Structure

```
WHOISLookup/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with metadata & JSON-LD schemas
│   │   ├── page.tsx                # Home/landing page with search
│   │   ├── globals.css             # Global CSS reset & design tokens
│   │   ├── robots.ts               # Robots.txt generation
│   │   ├── sitemap.ts              # Sitemap.xml generation
│   │   ├── [domain]/
│   │   │   └── page.tsx            # Dynamic domain results page
│   │   └── api/
│   │       └── lookup/
│   │           └── route.ts        # GET /api/lookup endpoint
│   ├── components/
│   │   ├── Header.tsx              # Sticky header with glass effect
│   │   ├── Footer.tsx              # Footer with branding
│   │   ├── SearchInput.tsx         # Domain search with validation
│   │   └── Loader.tsx              # Skeleton loading placeholder
│   ├── styles/
│   │   ├── Home.module.css         # Home page styles
│   │   ├── Components.module.css   # Component styles
│   │   └── Results.module.css      # Results page styles
│   └── utils/
│       └── lookup.ts               # All backend lookup logic
├── public/                          # Static assets
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies & scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/zakisheriff/WHOIS-Lookup.git
cd WHOIS-Lookup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🎯 Key Features

### For Everyone

✅ **Free Domain Lookup** — No account required, no paywalls  
✅ **Real-Time Data** — Live WHOIS, RDAP, DNS, and SSL queries  
✅ **Domain Validation** — Client-side and server-side regex validation  
✅ **Keyboard Shortcuts** — Press `/` to focus search instantly  
✅ **Mobile Responsive** — Works beautifully on all screen sizes  
✅ **Animated UI** — Smooth Framer Motion transitions and loading states

### For Security Researchers

✅ **Security Header Grading** — Letter-grade scoring (A+ to F)  
✅ **SSL Certificate Inspection** — Full cert details and expiry tracking  
✅ **DNSSEC Detection** — DNS security extension verification  
✅ **ASN & Hosting Lookup** — Identify hosting provider and infrastructure  
✅ **Redirect Chain Mapping** — Visual redirect path analysis

### For Domain Investors

✅ **Registration Dates** — Creation, expiration, and update timestamps  
✅ **Registrar Information** — Full registrar details from RDAP/WHOIS  
✅ **Domain Status** — Active, pending, or restricted status codes  
✅ **Nameserver Records** — Complete NS configuration

---

## 🔧 Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router
- **React 19** — Modern UI library
- **TypeScript 5** — Type-safe development
- **Framer Motion** — Smooth animations and transitions
- **CSS Modules** — Scoped, maintainable styling

### Backend (API Routes)
- **Node.js** — Serverless API functions
- **TCP Sockets** — Direct WHOIS protocol queries (port 43)
- **TLS Sockets** — SSL certificate inspection (port 443)
- **DNS Resolution** — Native Node.js `dns` module
- **HTTP Client** — Redirect chain tracking and header analysis

### Data Sources
- **WHOIS Protocol** — Raw TCP queries via port 43
- **RDAP** — `rdap.org` JSON API
- **Team Cymru** — ASN resolution via DNS TXT records

---

## 📊 Data Collected

### WHOIS / RDAP
- Registrar name and IANA ID
- Domain creation and expiration dates
- Last update timestamp
- Domain status codes
- Nameserver list

### DNS Records
- A, AAAA (IP addresses)
- MX (mail servers)
- TXT (SPF, DMARC, custom)
- NS (nameservers)
- CAA (certificate authorities)
- SOA (start of authority)
- DS (DNSSEC)

### SSL/TLS Certificate
- Common Name (CN)
- Issuer organization
- Valid from / Valid to
- Days remaining
- TLS protocol version
- Cipher suite
- Serial number

### HTTP Analysis
- Status codes and redirect chain
- Server header
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Security grade (A+ to F)

### Network
- IPv4 and IPv6 addresses
- Reverse DNS (PTR record)
- ASN (Autonomous System Number)
- Hosting ISP / Organization

---

## 🔒 Security Features

✅ **Client-Side Validation** — Regex-based domain input validation  
✅ **Server-Side Validation** — API endpoint domain format verification  
✅ **Input Sanitization** — Protocol and prefix stripping  
✅ **HTTP Caching** — 5-minute cache with stale-while-revalidate  
✅ **RDAP Caching** — 1-hour revalidation for registry data  
✅ **No Authentication Required** — Fully public tool  

---

## 📜 API Documentation

### Lookup Endpoint

```
GET /api/lookup?domain={domain}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The domain to investigate |

**Response:**
```json
{
  "domain": "example.com",
  "success": true,
  "overview": { ... },
  "dns": { ... },
  "ssl": { ... },
  "http": { ... },
  "rawRdap": { ... },
  "rawWhois": "..."
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600`

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import repository on Vercel
3. Deploy automatically

### Manual Deployment
1. Build: `npm run build`
2. Start: `npm start`
3. Ensure port 43 (WHOIS) and 443 (TLS) outbound access

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License — 100% Free and Open Source

---

## ☕️ Support the Project

If WHOIS Lookup helped you investigate a domain or inspired your next project:

- Consider buying me a coffee
- It keeps development alive and motivates future updates

<div align="center">
<a href="https://buymeacoffee.com/theoneatom">
<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="60" width="217">
</a>
</div>

---

<p align="center">
Made by <strong>Zaki Sheriff</strong>
</p>

<p align="center">
<em>Because domain intelligence should be free for everyone.</em>
</p>
