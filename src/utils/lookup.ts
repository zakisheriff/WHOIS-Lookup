import dns from 'dns';
import net from 'net';
import tls from 'tls';

// Helper to reverse an IPv4 address for Team Cymru DNS ASN lookups
function reverseIpv4(ip: string): string {
  return ip.split('.').reverse().join('.');
}

// Perform DNS TXT lookup to get ASN from IP via origin.asn.cymru.com
async function getAsnInfo(ip: string): Promise<{ asn: string; org: string } | null> {
  if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return null;
  }
  try {
    const reversedIp = reverseIpv4(ip);
    const query = `${reversedIp}.origin.asn.cymru.com`;
    const txtRecords = await dns.promises.resolveTxt(query);
    if (txtRecords && txtRecords.length > 0) {
      const parts = txtRecords[0][0].split('|').map(s => s.trim());
      const asn = parts[0]; // e.g. "15169"
      
      // Query the AS Description
      const descQuery = `AS${asn}.asn.cymru.com`;
      const descRecords = await dns.promises.resolveTxt(descQuery);
      if (descRecords && descRecords.length > 0) {
        const descParts = descRecords[0][0].split('|').map(s => s.trim());
        const org = descParts[4] || descParts[1] || 'Unknown';
        return { asn: `AS${asn}`, org };
      }
      return { asn: `AS${asn}`, org: 'Unknown ISP' };
    }
  } catch (e) {
    // Ignore and fallback
  }
  return null;
}

// Perform a raw TCP WHOIS query
export function queryWhoisRaw(domain: string, server: string = 'whois.iana.org'): Promise<string> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let response = '';

    socket.setTimeout(8000);

    socket.connect(43, server, () => {
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (data) => {
      response += data.toString('utf-8');
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve(response);
    });
  });
}

// Recursive WHOIS fetch starting at IANA
export async function getRecursiveWhois(domain: string): Promise<string> {
  try {
    let rawResult = await queryWhoisRaw(domain, 'whois.iana.org');
    if (!rawResult) return '';

    // Search for refer/whois server in IANA response
    const lines = rawResult.split('\n');
    let referServer = '';
    for (const line of lines) {
      if (line.toLowerCase().startsWith('refer:') || line.toLowerCase().startsWith('whois:')) {
        referServer = line.substring(line.indexOf(':') + 1).trim();
        break;
      }
    }

    if (referServer) {
      // Query the specific registry WHOIS server
      const secondResult = await queryWhoisRaw(domain, referServer);
      if (secondResult) {
        return secondResult;
      }
    }

    return rawResult;
  } catch (error) {
    return `WHOIS query failed: ${(error as Error).message}`;
  }
}

// Fetch RDAP json data
export async function fetchRdap(domain: string): Promise<any> {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: {
        'Accept': 'application/rdap+json, application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Ignore RDAP errors
  }
  return null;
}

// Get SSL certificate details using tls socket
export function getSslDetails(domain: string): Promise<any> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false // We want to inspect even invalid certificates
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const authorized = socket.authorized;
        const authorizationError = socket.authorizationError;
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();

        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          resolve(null);
          return;
        }

        const validFrom = cert.valid_from;
        const validTo = cert.valid_to;
        const daysRemaining = Math.max(0, Math.ceil((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        resolve({
          valid: authorized,
          error: authorizationError ? String(authorizationError) : undefined,
          subject: cert.subject?.CN || (typeof cert.subject === 'string' ? cert.subject : 'Unknown CN'),
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown Issuer',
          validFrom,
          validTo,
          daysRemaining,
          protocol: protocol || undefined,
          cipher: cipher?.name || undefined,
          serialNumber: cert.serialNumber || undefined
        });
      }
    );

    socket.setTimeout(5000);

    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

// Track redirects and fetch headers
export async function inspectHttp(domain: string): Promise<any> {
  const redirectChain: string[] = [];
  let currentUrl = `https://${domain}`;
  let headers: { key: string; value: string }[] = [];
  let statusCode = 0;
  let server = '';
  let hsts = false;
  let csp = false;

  const securityHeaders: { name: string; present: boolean; value?: string }[] = [
    { name: 'Strict-Transport-Security', present: false },
    { name: 'Content-Security-Policy', present: false },
    { name: 'X-Frame-Options', present: false },
    { name: 'X-Content-Type-Options', present: false },
    { name: 'Referrer-Policy', present: false },
    { name: 'Permissions-Policy', present: false }
  ];

  try {
    // Follow redirect chains up to 5 steps
    for (let i = 0; i < 5; i++) {
      redirectChain.push(currentUrl);
      const res = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      statusCode = res.status;
      
      // If we are at the end of the redirect chain
      if (res.status < 300 || res.status >= 400) {
        // Fetch headers
        res.headers.forEach((value, key) => {
          headers.push({ key, value });
          
          if (key.toLowerCase() === 'server') {
            server = value;
          }
          if (key.toLowerCase() === 'strict-transport-security') {
            hsts = true;
          }
          if (key.toLowerCase() === 'content-security-policy') {
            csp = true;
          }

          // Check predefined security headers
          const secHeader = securityHeaders.find(h => h.name.toLowerCase() === key.toLowerCase());
          if (secHeader) {
            secHeader.present = true;
            secHeader.value = value;
          }
        });
        break;
      }

      // Read Location header for redirect
      const location = res.headers.get('location');
      if (!location) break;

      if (location.startsWith('http://') || location.startsWith('https://')) {
        currentUrl = location;
      } else {
        const urlObj = new URL(currentUrl);
        currentUrl = `${urlObj.protocol}//${urlObj.host}${location.startsWith('/') ? '' : '/'}${location}`;
      }
    }

    return {
      statusCode,
      redirectChain,
      headers,
      server: server || 'Unknown',
      hsts,
      csp,
      securityHeaders
    };
  } catch (error) {
    return {
      statusCode: 0,
      redirectChain: [currentUrl],
      headers: [],
      server: 'Unreachable',
      hsts: false,
      csp: false,
      securityHeaders
    };
  }
}

// Safe resolver helper for DS records to prevent synchronous argument validation throws
async function resolveDsSafe(domain: string): Promise<any> {
  try {
    return await dns.promises.resolve(domain, 'DS');
  } catch (e) {
    return [];
  }
}

// Safe resolver helper for CAA records to prevent synchronous throws
async function resolveCaaSafe(domain: string): Promise<any> {
  try {
    return await dns.promises.resolveCaa(domain);
  } catch (e) {
    try {
      return await dns.promises.resolve(domain, 'CAA') as any;
    } catch (err) {
      return [];
    }
  }
}

// Perform DNS queries for standard records
export async function getDnsRecords(domain: string) {
  const records: any = {
    A: [],
    AAAA: [],
    MX: [],
    TXT: [],
    NS: [],
    CAA: [],
    SOA: null,
    DMARC: [],
    SPF: [],
    DNSSEC: {
      hasDnssec: false,
      dsRecords: []
    }
  };

  const dnsPromises = dns.promises;

  // Run resolutions in parallel and handle exceptions gracefully
  const [a, aaaa, mx, txt, ns, caa, soa, dmarc, ds] = await Promise.allSettled([
    dnsPromises.resolve4(domain),
    dnsPromises.resolve6(domain),
    dnsPromises.resolveMx(domain),
    dnsPromises.resolveTxt(domain),
    dnsPromises.resolveNs(domain),
    resolveCaaSafe(domain),
    dnsPromises.resolveSoa(domain),
    dnsPromises.resolveTxt(`_dmarc.${domain}`),
    resolveDsSafe(domain)
  ]);

  if (a.status === 'fulfilled') records.A = a.value;
  if (aaaa.status === 'fulfilled') records.AAAA = aaaa.value;
  if (mx.status === 'fulfilled') records.MX = mx.value.map(r => ({ exchange: r.exchange, priority: r.priority }));
  
  if (txt.status === 'fulfilled') {
    records.TXT = txt.value.map(r => r.join(' '));
    // Find SPF
    records.SPF = records.TXT.filter((r: string) => r.startsWith('v=spf1'));
  }

  if (ns.status === 'fulfilled') records.NS = ns.value;
  if (caa.status === 'fulfilled') records.CAA = (caa.value as any).map((r: any) => ({ tag: r.tag, value: r.value }));
  if (soa.status === 'fulfilled') records.SOA = soa.value;
  
  if (dmarc.status === 'fulfilled') {
    records.DMARC = dmarc.value.map(r => r.join(' '));
  }

  if (ds.status === 'fulfilled' && (ds.value as any).length > 0) {
    records.DNSSEC.hasDnssec = true;
    records.DNSSEC.dsRecords = (ds.value as any).map((r: any) => `${r.keyTag} ${r.algorithm} ${r.digestType} ${r.digest}`);
  }

  return records;
}

// Master resolver
export async function performDomainLookup(domain: string) {
  const normalizedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');

  try {
    // 1. Get DNS Records
    const dnsInfo = await getDnsRecords(normalizedDomain);

    // 2. Fetch IP and ASN info based on primary A record
    let ipAddress = dnsInfo.A[0] || '';
    let ipAddressV6 = dnsInfo.AAAA[0] || '';
    let asnInfo = null;
    let reverseDns = '';

    if (ipAddress) {
      const [asn, rev] = await Promise.allSettled([
        getAsnInfo(ipAddress),
        dns.promises.reverse(ipAddress)
      ]);

      if (asn.status === 'fulfilled') asnInfo = asn.value;
      if (rev.status === 'fulfilled' && rev.value.length > 0) {
        reverseDns = rev.value[0];
      }
    }

    // 3. Fetch SSL certificate & HTTP details
    const [sslInfo, httpInfo, rdapInfo, whoisInfo] = await Promise.allSettled([
      getSslDetails(normalizedDomain),
      inspectHttp(normalizedDomain),
      fetchRdap(normalizedDomain),
      getRecursiveWhois(normalizedDomain)
    ]);

    // 4. Compile Overview details from RDAP or fallbacks
    let registrar = 'Unknown';
    let creationDate = '';
    let expirationDate = '';
    let updatedDate = '';
    let status: string[] = [];
    let nameservers = dnsInfo.NS || [];
    let registrantName = 'Unknown';
    let registrantEmail = 'Unknown';

    const rdap = rdapInfo.status === 'fulfilled' ? rdapInfo.value : null;
    const rawWhois = whoisInfo.status === 'fulfilled' ? whoisInfo.value : '';

    if (rdap) {
      // Extract registrar name
      const registrarEntity = rdap.entities?.find((e: any) => e.roles?.includes('registrar'));
      if (registrarEntity) {
        registrar = registrarEntity.vcardArray?.[1]?.find((prop: any) => prop[0] === 'fn')?.[3] || registrarEntity.handle || 'Unknown';
      }

      // Extract events
      const events = rdap.events || [];
      const regEvent = events.find((e: any) => e.eventAction === 'registration');
      const expEvent = events.find((e: any) => e.eventAction === 'expiration');
      const updEvent = events.find((e: any) => e.eventAction === 'last changed');

      if (regEvent) creationDate = regEvent.eventDate;
      if (expEvent) expirationDate = expEvent.eventDate;
      if (updEvent) updatedDate = updEvent.eventDate;

      if (rdap.status) status = rdap.status;
      if (rdap.nameservers) {
        nameservers = rdap.nameservers.map((n: any) => n.ldhName.toLowerCase());
      }

      // Extract registrant details
      const registrantEntity = rdap.entities?.find((e: any) => e.roles?.includes('registrant'));
      if (registrantEntity) {
        const vcard = registrantEntity.vcardArray?.[1] || [];
        const fnProp = vcard.find((prop: any) => prop[0] === 'fn');
        const emailProp = vcard.find((prop: any) => prop[0] === 'email');
        if (fnProp) registrantName = fnProp[3] || 'Unknown';
        if (emailProp) registrantEmail = emailProp[3] || 'Unknown';
      }
    }

    // Parse dates/registrar from raw WHOIS text if RDAP was empty
    if (!creationDate && rawWhois) {
      const createMatch = rawWhois.match(/(Creation Date|Created On|Created|Registered On|Creation-Date):\s*([^\r\n]+)/i);
      const expireMatch = rawWhois.match(/(Registry Expiry Date|Expiry Date|Expiration Date|Expires On|Expires|Expiration-Date):\s*([^\r\n]+)/i);
      const updateMatch = rawWhois.match(/(Updated Date|Updated On|Last Updated|Updated|Update-Date):\s*([^\r\n]+)/i);
      const registrarMatch = rawWhois.match(/(Registrar|Sponsoring Registrar|Registrar Name):\s*([^\r\n]+)/i);

      if (createMatch) creationDate = new Date(createMatch[2].trim()).toISOString();
      if (expireMatch) expirationDate = new Date(expireMatch[2].trim()).toISOString();
      if (updateMatch) updatedDate = new Date(updateMatch[2].trim()).toISOString();
      if (registrarMatch && registrar === 'Unknown') registrar = registrarMatch[2].trim();
    }

    // Parse nameservers from raw WHOIS text if they are still empty
    if ((!nameservers || nameservers.length === 0) && rawWhois) {
      const nsMatches = rawWhois.match(/(Name Server|Nameserver|Nserver):\s*([^\r\n]+)/gi);
      if (nsMatches) {
        nameservers = nsMatches.map(match => {
          const parts = match.split(':');
          return parts[1].trim().toLowerCase();
        }).filter(ns => ns && ns.includes('.'));
      }
    }

    // Parse registrant details from raw WHOIS text
    if (rawWhois) {
      const nameMatch = rawWhois.match(/(Registrant Name|Registrant):\s*([^\r\n]+)/i);
      const emailMatch = rawWhois.match(/(Registrant Email|Registrant Contact Email|Registrant Contact E-mail):\s*([^\r\n]+)/i);
      if (nameMatch && (registrantName === 'Unknown' || !registrantName)) {
        registrantName = nameMatch[2].trim();
      }
      if (emailMatch && (registrantEmail === 'Unknown' || !registrantEmail)) {
        registrantEmail = emailMatch[2].trim();
      }
    }

    return {
      domain: normalizedDomain,
      success: true,
      overview: {
        registrar,
        creationDate,
        expirationDate,
        updatedDate,
        status,
        nameservers,
        dnssec: dnsInfo.DNSSEC.hasDnssec,
        ipAddress,
        ipAddressV6,
        asn: asnInfo?.asn,
        hostingProvider: asnInfo?.org,
        reverseDns,
        registrantName,
        registrantEmail
      },
      dns: dnsInfo,
      ssl: sslInfo.status === 'fulfilled' ? sslInfo.value : undefined,
      http: httpInfo.status === 'fulfilled' ? httpInfo.value : undefined,
      rawRdap: rdap,
      rawWhois
    };
  } catch (error) {
    return {
      domain: normalizedDomain,
      success: false,
      error: (error as Error).message
    };
  }
}
