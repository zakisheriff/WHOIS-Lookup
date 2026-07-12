import { getDnsRecords, getAsnInfo, getReverseDns } from './dns';
import { getRecursiveWhois, parseWhoisData } from './whois';
import { fetchRdap, extractRdapOverview } from './rdap';
import { getSslDetails } from './ssl';
import { inspectHttp } from './http';

export interface DomainLookupResult {
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
  dns: Awaited<ReturnType<typeof getDnsRecords>>;
  ssl: Awaited<ReturnType<typeof getSslDetails>>;
  http: Awaited<ReturnType<typeof inspectHttp>>;
  rawRdap: Record<string, unknown> | null;
  rawWhois: string;
}

function cleanDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.split('/')[0];
  domain = domain.split(':')[0];
  return domain;
}

export async function performDomainLookup(input: string): Promise<DomainLookupResult> {
  const domain = cleanDomain(input);

  const emptyResult: DomainLookupResult = {
    domain,
    success: false,
    overview: {
      registrar: '',
      creationDate: '',
      expirationDate: '',
      updatedDate: '',
      status: [],
      nameservers: [],
      dnssec: false,
    },
    network: {
      ipv4: [],
      ipv6: [],
      reverseDns: null,
      asn: null,
    },
    dns: {
      a: [], aaaa: [], mx: [], txt: [], ns: [], cname: [], caa: [],
      soa: null, spf: '', dmarc: '', ds: [], srv: [],
    },
    ssl: { valid: false },
    http: { redirectChain: [], headers: {}, securityHeaders: {
      hsts: false, csp: false, xFrameOptions: false,
      xContentTypeOptions: false, referrerPolicy: false, permissionsPolicy: false,
    }, securityGrade: 'F' },
    rawRdap: null,
    rawWhois: '',
  };

  try {
    const [dnsRecords, rdapData, rawWhois, sslInfo, httpInfo] = await Promise.allSettled([
      getDnsRecords(domain),
      fetchRdap(domain),
      getRecursiveWhois(domain),
      getSslDetails(domain),
      inspectHttp(domain),
    ]);

    const dns = dnsRecords.status === 'fulfilled' ? dnsRecords.value : emptyResult.dns;
    const rdap = rdapData.status === 'fulfilled' ? rdapData.value : null;
    const whois = rawWhois.status === 'fulfilled' ? rawWhois.value : '';
    const ssl = sslInfo.status === 'fulfilled' ? sslInfo.value : emptyResult.ssl;
    const http = httpInfo.status === 'fulfilled' ? httpInfo.value : emptyResult.http;

    const firstIp = dns.a[0] || null;
    const [reverseDns, asnInfo] = firstIp
      ? await Promise.all([getReverseDns(firstIp), getAsnInfo(firstIp)])
      : [null, null];

    let overview = {
      registrar: '',
      creationDate: '',
      expirationDate: '',
      updatedDate: '',
      status: [] as string[],
      nameservers: dns.ns,
      dnssec: dns.ds.length > 0,
    };

    if (rdap) {
      const rdapOverview = extractRdapOverview(rdap);
      overview = {
        ...overview,
        registrar: rdapOverview.registrar,
        creationDate: rdapOverview.creationDate,
        expirationDate: rdapOverview.expirationDate,
        updatedDate: rdapOverview.updatedDate,
        status: rdapOverview.status,
        nameservers: rdapOverview.nameservers.length > 0 ? rdapOverview.nameservers : overview.nameservers,
        dnssec: rdapOverview.dnssec || overview.dnssec,
      };
    } else if (whois) {
      const parsed = parseWhoisData(whois);
      overview = {
        ...overview,
        registrar: parsed.registrar || '',
        creationDate: parsed.creationDate || '',
        expirationDate: parsed.expirationDate || '',
        updatedDate: parsed.updatedDate || '',
        status: parsed.status || [],
        nameservers: parsed.nameServers && parsed.nameServers.length > 0 ? parsed.nameServers : overview.nameservers,
      };
    }

    return {
      domain,
      success: true,
      overview,
      network: {
        ipv4: dns.a,
        ipv6: dns.aaaa,
        reverseDns,
        asn: asnInfo,
      },
      dns,
      ssl,
      http,
      rawRdap: rdap as Record<string, unknown> | null,
      rawWhois: whois,
    };
  } catch {
    return emptyResult;
  }
}
