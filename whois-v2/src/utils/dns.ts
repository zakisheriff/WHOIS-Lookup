import * as dns from 'dns';
import * as tls from 'tls';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveSoa = promisify(dns.resolveSoa);
const resolveCaa = promisify(dns.resolveCaa);
const resolveCname = promisify(dns.resolveCname);
const resolvePtr = promisify(dns.resolvePtr);
const resolveSrv = promisify(dns.resolveSrv);

export interface DnsRecords {
  a: string[];
  aaaa: string[];
  mx: dns.MxRecord[];
  txt: string[];
  ns: string[];
  cname: string[];
  caa: dns.CaaRecord[];
  soa: dns.SoaRecord | null;
  spf: string;
  dmarc: string;
  ds: string[];
  srv: dns.SrvRecord[];
}

export async function getDnsRecords(domain: string): Promise<DnsRecords> {
  const results: DnsRecords = {
    a: [],
    aaaa: [],
    mx: [],
    txt: [],
    ns: [],
    cname: [],
    caa: [],
    soa: null,
    spf: '',
    dmarc: '',
    ds: [],
    srv: [],
  };

  const safeResolve = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const [a, aaaa, mx, txt, ns, cname, caa, soa, srv] = await Promise.all([
    safeResolve(() => resolve4(domain)),
    safeResolve(() => resolve6(domain)),
    safeResolve(() => resolveMx(domain)),
    safeResolve(() => resolveTxt(domain)),
    safeResolve(() => resolveNs(domain)),
    safeResolve(() => resolveCname(domain)),
    safeResolve(() => resolveCaa(domain)),
    safeResolve(() => resolveSoa(domain)),
    safeResolve(() => resolveSrv(domain)),
  ]);

  if (a) results.a = a;
  if (aaaa) results.aaaa = aaaa;
  if (mx) results.mx = mx;
  if (ns) results.ns = ns;
  if (cname) results.cname = cname;
  if (caa) results.caa = caa;
  if (soa) results.soa = soa;
  if (srv) results.srv = srv;

  if (txt) {
    results.txt = txt.map((t) => t.join(''));
    const spfRecord = results.txt.find((t) => t.startsWith('v=spf1'));
    if (spfRecord) results.spf = spfRecord;
  }

  const dmarcRecords = await safeResolve(() => resolveTxt(`_dmarc.${domain}`));
  if (dmarcRecords) {
    const dmarc = dmarcRecords.map((t) => t.join('')).find((t) => t.startsWith('v=DMARC1'));
    if (dmarc) results.dmarc = dmarc;
  }

  const dsRecords = await safeResolve(() => resolveTxt(`_ds.${domain}`));
  if (dsRecords) {
    results.ds = dsRecords.map((t) => t.join(''));
  }

  return results;
}

export function reverseIpv4(ip: string): string {
  return ip.split('.').reverse().join('.');
}

export async function getAsnInfo(ip: string): Promise<{ asn: string; org: string } | null> {
  try {
    const reversed = reverseIpv4(ip);
    const txtRecords = await promisify(dns.resolveTxt)(`${reversed}.origin.asn.cymru.com`);
    if (txtRecords.length > 0) {
      const data = txtRecords[0].join('');
      const parts = data.split(' | ');
      if (parts.length >= 5) {
        const asn = parts[1].trim();
        const asnData = await promisify(dns.resolveTxt)(`AS${asn}.asn.cymru.com`);
        if (asnData.length > 0) {
          const orgParts = asnData[0].join('').split(' | ');
          return { asn, org: orgParts[orgParts.length - 1].trim() };
        }
        return { asn, org: '' };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function getReverseDns(ip: string): Promise<string | null> {
  try {
    const names = await promisify(dns.reverse)(ip);
    return names.length > 0 ? names[0] : null;
  } catch {
    return null;
  }
}
