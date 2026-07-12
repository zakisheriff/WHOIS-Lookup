'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchInput from '@/components/SearchInput';
import Loader from '@/components/Loader';
import styles from '@/styles/Results.module.css';

export default function DomainResult() {
  const params = useParams();
  const router = useRouter();
  const rawDomain = params?.domain as string;
  const domain = decodeURIComponent(rawDomain);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'raw-rdap' | 'raw-whois'>('visual');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  useEffect(() => {
    if (!domain) return;

    // Save search query into recent searches
    try {
      const searchesStr = localStorage.getItem('atom_recent_whois');
      let searches: string[] = searchesStr ? JSON.parse(searchesStr) : [];
      // Filter out duplicate searches and keep up to 5 entries
      searches = [domain, ...searches.filter((d) => d !== domain)].slice(0, 5);
      localStorage.setItem('atom_recent_whois', JSON.stringify(searches));
    } catch (e) {
      // Ignore localStorage errors
    }

    setLoading(true);
    setError(null);

    // Call internal Next API endpoint
    fetch(`/api/lookup?domain=${domain}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((json) => {
            throw new Error(json.error || 'Failed to fetch domain intelligence');
          });
        }
        return res.json();
      })
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error || 'Lookup execution failed');
        }
        setData(json);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [domain]);

  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyRawText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `domain_intelligence_${domain}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Date formatter helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  // Security headers grading helper based on standard rules
  const getSecurityGrade = (headers: any[]) => {
    if (!headers) return { grade: 'F', color: '#ef4444' };
    const presentCount = headers.filter(h => h.present).length;
    const hasHsts = headers.find(h => h.name.toLowerCase() === 'strict-transport-security')?.present;
    const hasCsp = headers.find(h => h.name.toLowerCase() === 'content-security-policy')?.present;

    let grade = 'F';
    let color = '#ef4444'; // Red

    if (presentCount === 6) {
      grade = 'A+';
      color = '#10b981'; // Green
    } else if (presentCount === 5) {
      grade = 'A';
      color = '#10b981';
    } else if (presentCount === 4) {
      const isB = hasHsts && hasCsp;
      grade = isB ? 'B' : 'C';
      color = isB ? '#10b981' : '#f59e0b'; // Green or Yellow
    } else if (presentCount === 3) {
      grade = 'C';
      color = '#f59e0b'; // Yellow
    } else if (presentCount === 2) {
      grade = 'D';
      color = '#f59e0b';
    } else if (presentCount === 1) {
      grade = 'E';
      color = '#ef4444';
    } else {
      grade = 'F';
      color = '#ef4444';
    }
    return { grade, color };
  };

  // Rendering Helper: Render DNS records table row
  const renderDnsRows = (type: string, records: any[]) => {
    if (!records || records.length === 0) return null;
    return records.map((record, index) => {
      let value = '';
      if (typeof record === 'string') {
        value = record;
      } else if (record && typeof record === 'object') {
        if (record.exchange) {
          value = `[Priority ${record.priority}] ${record.exchange}`;
        } else if (record.tag) {
          value = `${record.tag} "${record.value}"`;
        } else {
          value = JSON.stringify(record);
        }
      }
      return (
        <tr key={`${type}-${index}`}>
          <td style={{ width: '120px' }}>
            <span className={styles.dnsType}>{type}</span>
          </td>
          <td className="mono" style={{ wordBreak: 'break-all' }}>{value}</td>
        </tr>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        <div className={styles.container}>
          {/* Header Action Section */}
          <div className={styles.searchHeader}>
            <div className={styles.searchHeaderLeft}>
              <h1 className={styles.domainName}>{domain}</h1>
            </div>
            <div className={styles.searchHeaderRight}>
              <button onClick={copyShareLink} className={styles.btn}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
              {data && (
                <button onClick={downloadJson} className={`${styles.btn} ${styles.btnPrimary}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download JSON</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: '640px', marginBottom: '32px' }}>
            <SearchInput initialValue={domain} />
          </div>

          {/* Conditional Layout Rendering */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ textAlign: 'center', padding: '60px 20px' }}
              >
                <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Lookup Failed</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
                <button onClick={() => router.push('/')} className={styles.btn}>Back to Home</button>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {/* Visual / Raw Toggles */}
                <div className={styles.tabs}>
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`${styles.tabBtn} ${activeTab === 'visual' ? styles.tabBtnActive : ''}`}
                  >
                    {activeTab === 'visual' && (
                      <motion.div
                        layoutId="activeTabPill"
                        className={styles.activeBg}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={styles.tabBtnText}>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('raw-rdap')}
                    className={`${styles.tabBtn} ${activeTab === 'raw-rdap' ? styles.tabBtnActive : ''}`}
                  >
                    {activeTab === 'raw-rdap' && (
                      <motion.div
                        layoutId="activeTabPill"
                        className={styles.activeBg}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={styles.tabBtnText}>Raw RDAP</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('raw-whois')}
                    className={`${styles.tabBtn} ${activeTab === 'raw-whois' ? styles.tabBtnActive : ''}`}
                  >
                    {activeTab === 'raw-whois' && (
                      <motion.div
                        layoutId="activeTabPill"
                        className={styles.activeBg}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={styles.tabBtnText}>Raw WHOIS</span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'visual' ? (
                  <div className={styles.dashboardGrid}>
                    {/* Left Column: DNS, SSL, HTTP */}
                    <div className={styles.mainColumn}>
                      {/* DNS Records */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </span>
                            <span>DNS Records</span>
                          </h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className={styles.dnsTable}>
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Record Details / Target</th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderDnsRows('A', data.dns?.A)}
                              {renderDnsRows('AAAA', data.dns?.AAAA)}
                              {renderDnsRows('MX', data.dns?.MX)}
                              {renderDnsRows('NS', data.dns?.NS)}
                              {renderDnsRows('TXT', data.dns?.TXT)}
                              {renderDnsRows('CAA', data.dns?.CAA)}
                              {renderDnsRows('SPF', data.dns?.SPF)}
                              {renderDnsRows('DMARC', data.dns?.DMARC)}
                              {data.dns?.SOA && (
                                <tr>
                                  <td><span className={styles.dnsType}>SOA</span></td>
                                  <td className="mono" style={{ fontSize: '0.85rem' }}>
                                    Host: {data.dns.SOA.nsname} | Admin: {data.dns.SOA.hostmaster} | Serial: {data.dns.SOA.serial}
                                  </td>
                                </tr>
                              )}
                              {(!data.dns || Object.keys(data.dns).every(k => !data.dns[k] || data.dns[k].length === 0)) && (
                                <tr>
                                  <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No DNS records found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SSL Certificate details */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </span>
                            <span>SSL Certificate</span>
                          </h3>
                          {data.ssl?.valid ? (
                            <span className={`${styles.badge} ${styles.badgeGreen}`}>Secure</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeRed}`}>No SSL / Unverified</span>
                          )}
                        </div>
                        {data.ssl ? (
                          <div className={styles.overviewList}>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Common Name (CN)</span>
                              <span className={styles.value}>{data.ssl.subject}</span>
                            </div>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Issuer Organization</span>
                              <span className={styles.value}>{data.ssl.issuer}</span>
                            </div>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Protocol / Cipher</span>
                              <span className={styles.value}>{data.ssl.protocol} ({data.ssl.cipher})</span>
                            </div>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Valid From</span>
                              <span className={styles.value}>{formatDate(data.ssl.validFrom)}</span>
                            </div>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Valid Until</span>
                              <span className={styles.value}>{formatDate(data.ssl.validTo)}</span>
                            </div>
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>Days Remaining</span>
                              <span className={styles.value}>{data.ssl.daysRemaining} days</span>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No SSL certificate details could be loaded.</p>
                        )}
                      </div>

                      {/* HTTP Response & Redirect Chain */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </span>
                            <span>Redirect Chain & Headers</span>
                          </h3>
                        </div>
                        {data.http ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Redirect Path</h4>
                              <div className={styles.redirectChain}>
                                {data.http.redirectChain?.map((url: string, index: number) => (
                                  <div key={index} className={styles.redirectStep}>
                                    <span className={styles.redirectIndex}>{index + 1}</span>
                                    <span className={styles.redirectUrl}>{url}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Security Headers Status</h4>
                                {(() => {
                                  const { grade, color } = getSecurityGrade(data.http.securityHeaders);
                                  return (
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: color, letterSpacing: '0.02em' }}>
                                      Grade {grade}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {data.http.securityHeaders?.map((header: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`${styles.badge} ${header.present ? styles.badgeGreen : styles.badgeRed}`}
                                  >
                                    {header.name}: {header.present ? 'Enabled' : 'Missing'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)' }}>No HTTP metrics could be gathered.</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Registry Overview */}
                    <div className={styles.sideColumn}>
                      {/* Domain Overview Card */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            <span>Registry Overview</span>
                          </h3>
                        </div>
                        <div className={styles.overviewList}>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Registrar</span>
                            <span className={styles.value}>{data.overview?.registrar || 'Unknown'}</span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Created On</span>
                            <span className={styles.value}>{formatDate(data.overview?.creationDate)}</span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Expires On</span>
                            <span className={styles.value}>{formatDate(data.overview?.expirationDate)}</span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Last Updated</span>
                            <span className={styles.value}>{formatDate(data.overview?.updatedDate)}</span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>DNSSEC State</span>
                            <span className={styles.value}>{data.overview?.dnssec ? 'Signed' : 'Unsigned'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Server & Hosting Card */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </span>
                            <span>Network & Host</span>
                          </h3>
                        </div>
                        <div className={styles.overviewList}>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>IP Address</span>
                            <span className={`${styles.value} ${styles.valueMono}`}>{data.overview?.ipAddress || 'None'}</span>
                          </div>
                          {data.overview?.ipAddressV6 && (
                            <div className={styles.overviewItem}>
                              <span className={styles.label}>IPv6 Address</span>
                              <span className={`${styles.value} ${styles.valueMono}`}>{data.overview?.ipAddressV6}</span>
                            </div>
                          )}
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Reverse DNS</span>
                            <span className={`${styles.value} ${styles.valueMono}`} style={{ fontSize: '0.75rem' }}>
                              {data.overview?.reverseDns || 'None'}
                            </span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>ASN</span>
                            <span className={styles.value}>{data.overview?.asn || 'Unknown'}</span>
                          </div>
                          <div className={styles.overviewItem}>
                            <span className={styles.label}>Hosting ISP</span>
                            <span className={styles.value}>{data.overview?.hostingProvider || 'Unknown'}</span>
                          </div>
                          <div className={styles.overviewItem} style={{ alignItems: 'flex-start' }}>
                            <span className={styles.label}>Nameservers</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                              {data.overview?.nameservers?.map((ns: string) => (
                                <span key={ns} className={styles.value} style={{ fontSize: '0.95rem' }}>{ns}</span>
                              )) || <span className={styles.value}>None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'raw-rdap' ? (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>Raw RDAP (JSON Response)</h3>
                      <button
                        onClick={() => copyRawText(JSON.stringify(data.rawRdap, null, 2))}
                        className={styles.btn}
                      >
                        {copiedRaw ? 'Copied!' : 'Copy Data'}
                      </button>
                    </div>
                    {data.rawRdap ? (
                      <div className={styles.rawContainer}>
                        <pre className={styles.rawText}>
                          {JSON.stringify(data.rawRdap, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No RDAP JSON records available.</p>
                    )}
                  </div>
                ) : (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>Raw WHOIS Response Log</h3>
                      <button
                        onClick={() => copyRawText(data.rawWhois)}
                        className={styles.btn}
                      >
                        {copiedRaw ? 'Copied!' : 'Copy Logs'}
                      </button>
                    </div>
                    {data.rawWhois ? (
                      <div className={styles.rawContainer}>
                        <pre className={styles.rawText}>{data.rawWhois}</pre>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No raw WHOIS logs returned from TCP connection.</p>
                    )}
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
