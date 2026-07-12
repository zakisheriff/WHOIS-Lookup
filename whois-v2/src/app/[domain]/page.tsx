'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchInput from '@/components/SearchInput';
import Loader from '@/components/Loader';

type TabType = 'dashboard' | 'rdap' | 'whois';

interface LookupResult {
  domain: string;
  success: boolean;
  overview: {
    registrar: string;
    creationDate: string;
    expirationDate: string;
    updatedDate: string;
    status: string[];
    nameservers: string[];
    dnssec: boolean;
  };
  network: {
    ipv4: string[];
    ipv6: string[];
    reverseDns: string | null;
    asn: { asn: string; org: string } | null;
  };
  dns: {
    a: string[];
    aaaa: string[];
    mx: Array<{ exchange: string; priority: number }>;
    txt: string[];
    ns: string[];
    cname: string[];
    caa: Array<{ flags: number; tag: string; value: string }>;
    soa: { nsname: string; hostmaster: string; serial: number } | null;
    spf: string;
    dmarc: string;
    ds: string[];
  };
  ssl: {
    valid: boolean;
    subject?: string;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    daysRemaining?: number;
    protocol?: string;
    cipher?: string;
  };
  http: {
    statusCode?: number;
    redirectChain: string[];
    headers: Record<string, string>;
    server?: string;
    securityHeaders: {
      hsts: boolean;
      csp: boolean;
      xFrameOptions: boolean;
      xContentTypeOptions: boolean;
      referrerPolicy: boolean;
      permissionsPolicy: boolean;
    };
    securityGrade: string;
  };
  rawRdap: Record<string, unknown> | null;
  rawWhois: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusColor(statuses: string[]): string {
  const joined = statuses.join(' ').toLowerCase();
  if (joined.includes('ok') || joined.includes('active')) return 'green';
  if (joined.includes('pending') || joined.includes('hold')) return 'yellow';
  return 'red';
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function downloadJson(data: LookupResult) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.domain}-whois.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DomainPage() {
  const params = useParams();
  const domain = params.domain as string;
  const [data, setData] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!domain) return;

    setLoading(true);
    setError('');

    const searches = JSON.parse(localStorage.getItem('atom_recent_whois') || '[]');
    const updated = [domain, ...searches.filter((s: string) => s !== domain)].slice(0, 5);
    localStorage.setItem('atom_recent_whois', JSON.stringify(updated));

    fetch(`/api/lookup?domain=${domain}`)
      .then((res) => {
        if (!res.ok) throw new Error('Lookup failed');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('Failed to fetch domain data'))
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) return <><Header /><Loader /><Footer /></>;

  if (error || !data || !data.success) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">!</div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Lookup Failed</h2>
            <p className="text-[var(--text-secondary)] mb-6">{error || 'Could not retrieve domain data'}</p>
            <Link href="/" className="text-[var(--accent-primary)] hover:underline">
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopyLink = () => {
    copyToClipboard(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 w-full max-w-[var(--container-max)] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] truncate">
              {domain}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => downloadJson(data)}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>

          <div className="w-full max-w-md mb-6">
            <SearchInput initialValue={domain} compact />
          </div>

          <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg w-fit">
            {(['dashboard', 'rdap', 'whois'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[var(--bg-card)] rounded-md shadow-sm"
                  />
                )}
                <span className="relative z-10">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    DNS Records
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-color)]">
                          <th className="text-left py-2 text-[var(--text-muted)] font-medium">Type</th>
                          <th className="text-left py-2 text-[var(--text-muted)] font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody className="mono text-xs">
                        {data.dns.a.map((ip) => (
                          <tr key={`a-${ip}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">A</span></td>
                            <td className="py-2 text-[var(--text-primary)]">{ip}</td>
                          </tr>
                        ))}
                        {data.dns.aaaa.map((ip) => (
                          <tr key={`aaaa-${ip}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">AAAA</span></td>
                            <td className="py-2 text-[var(--text-primary)]">{ip}</td>
                          </tr>
                        ))}
                        {data.dns.mx.map((mx) => (
                          <tr key={`mx-${mx.exchange}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">MX</span></td>
                            <td className="py-2 text-[var(--text-primary)]">{mx.exchange} ({mx.priority})</td>
                          </tr>
                        ))}
                        {data.dns.ns.map((ns) => (
                          <tr key={`ns-${ns}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">NS</span></td>
                            <td className="py-2 text-[var(--text-primary)]">{ns}</td>
                          </tr>
                        ))}
                        {data.dns.txt.map((txt, i) => (
                          <tr key={`txt-${i}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">TXT</span></td>
                            <td className="py-2 text-[var(--text-primary)] break-all">{txt}</td>
                          </tr>
                        ))}
                        {data.dns.caa.map((caa, i) => (
                          <tr key={`caa-${i}`} className="border-b border-[var(--border-color)]/50">
                            <td className="py-2"><span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">CAA</span></td>
                            <td className="py-2 text-[var(--text-primary)]">{caa.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    SSL Certificate
                  </h3>
                  {data.ssl.valid !== false ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Subject</span><span className="mono text-xs">{data.ssl.subject || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Issuer</span><span className="text-xs">{data.ssl.issuer || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Valid From</span><span className="text-xs">{formatDate(data.ssl.validFrom || '')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Valid To</span><span className="text-xs">{formatDate(data.ssl.validTo || '')}</span></div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Days Remaining</span>
                        <span className={`text-xs font-medium ${(data.ssl.daysRemaining || 0) < 30 ? 'text-red-600' : 'text-green-600'}`}>
                          {data.ssl.daysRemaining ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Protocol</span><span className="text-xs">{data.ssl.protocol || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Cipher</span><span className="text-xs">{data.ssl.cipher || '—'}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No SSL certificate found</p>
                  )}
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    HTTP &amp; Security Headers
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Security Grade</span>
                      <span className={`text-lg font-bold ${
                        data.http.securityGrade.startsWith('A') ? 'text-green-600' :
                        data.http.securityGrade === 'B' ? 'text-blue-600' :
                        data.http.securityGrade === 'C' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {data.http.securityGrade}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Status</span><span className="text-xs">{data.http.statusCode || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Server</span><span className="text-xs">{data.http.server || '—'}</span></div>
                    {data.http.redirectChain.length > 1 && (
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Redirect Chain:</span>
                        <div className="mt-1 space-y-1">
                          {data.http.redirectChain.map((url, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs mono">
                              <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px]">{i + 1}</span>
                              <span className="truncate">{url}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Registry Overview</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Registrar</span><span className="text-xs text-right max-w-[60%]">{data.overview.registrar || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Created</span><span className="text-xs">{formatDate(data.overview.creationDate)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Expires</span><span className="text-xs">{formatDate(data.overview.expirationDate)}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Updated</span><span className="text-xs">{formatDate(data.overview.updatedDate)}</span></div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">DNSSEC</span>
                      <span className={`text-xs font-medium ${data.overview.dnssec ? 'text-green-600' : 'text-[var(--text-muted)]'}`}>
                        {data.overview.dnssec ? 'Signed' : 'Unsigned'}
                      </span>
                    </div>
                    {data.overview.status.length > 0 && (
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Status:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {data.overview.status.map((s, i) => (
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${
                              getStatusColor([s]) === 'green' ? 'bg-green-100 text-green-700' :
                              getStatusColor([s]) === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Network &amp; Host</h3>
                  <div className="space-y-3 text-sm">
                    {data.network.ipv4.length > 0 && (
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">IPv4:</span>
                        <div className="mono text-xs mt-1 space-y-0.5">
                          {data.network.ipv4.map((ip) => <div key={ip}>{ip}</div>)}
                        </div>
                      </div>
                    )}
                    {data.network.ipv6.length > 0 && (
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">IPv6:</span>
                        <div className="mono text-xs mt-1 space-y-0.5">
                          {data.network.ipv6.map((ip) => <div key={ip} className="break-all">{ip}</div>)}
                        </div>
                      </div>
                    )}
                    {data.network.reverseDns && (
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Reverse DNS</span><span className="mono text-xs">{data.network.reverseDns}</span></div>
                    )}
                    {data.network.asn && (
                      <>
                        <div className="flex justify-between"><span className="text-[var(--text-muted)]">ASN</span><span className="mono text-xs">{data.network.asn.asn}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--text-muted)]">ISP</span><span className="text-xs text-right max-w-[60%]">{data.network.asn.org}</span></div>
                      </>
                    )}
                  </div>
                </div>

                {data.overview.nameservers.length > 0 && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Nameservers</h3>
                    <div className="space-y-1">
                      {data.overview.nameservers.map((ns) => (
                        <div key={ns} className="mono text-xs text-[var(--text-secondary)]">{ns}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'rdap' && (
            <motion.div
              key="rdap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Raw RDAP Response</h3>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data.rawRdap, null, 2))}
                  className="text-xs text-[var(--accent-primary)] hover:underline"
                >
                  Copy
                </button>
              </div>
              <pre className="mono text-xs text-[var(--text-secondary)] overflow-auto max-h-[550px] p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
                {JSON.stringify(data.rawRdap, null, 2)}
              </pre>
            </motion.div>
          )}

          {activeTab === 'whois' && (
            <motion.div
              key="whois"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Raw WHOIS Response</h3>
                <button
                  onClick={() => copyToClipboard(data.rawWhois)}
                  className="text-xs text-[var(--accent-primary)] hover:underline"
                >
                  Copy
                </button>
              </div>
              <pre className="mono text-xs text-[var(--text-secondary)] overflow-auto max-h-[550px] p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] whitespace-pre-wrap">
                {data.rawWhois || 'No WHOIS data available'}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
