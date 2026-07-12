export interface RdapData {
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: Array<{
    eventAction: string;
    eventDate: string;
  }>;
  entities?: Array<{
    handle?: string;
    roles?: string[];
    vcardArray?: [string, Array<Array<unknown>>];
  }>;
  nameservers?: Array<{
    ldhName: string;
  }>;
  secureDNS?: {
    delegationSigned: boolean;
  };
}

export async function fetchRdap(domain: string): Promise<RdapData | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: {
        'Accept': 'application/rdap+json',
        'User-Agent': 'WHOIS-Lookup/1.0',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function extractRdapOverview(rdap: RdapData) {
  const registrar = rdap.entities?.find((e) =>
    e.roles?.includes('registrar')
  );

  let registrarName = '';
  if (registrar?.vcardArray) {
    const nameEntry = registrar.vcardArray[1]?.find(
      (item) => item[0] === 'fn'
    );
    if (nameEntry) registrarName = nameEntry[3] as string;
  }

  const creationEvent = rdap.events?.find((e) => e.eventAction === 'registration');
  const expirationEvent = rdap.events?.find((e) => e.eventAction === 'expiration');
  const updateEvent = rdap.events?.find((e) => e.eventAction === 'last changed');

  return {
    domain: rdap.ldhName || '',
    registrar: registrarName,
    registrarHandle: registrar?.handle || '',
    status: rdap.status || [],
    creationDate: creationEvent?.eventDate || '',
    expirationDate: expirationEvent?.eventDate || '',
    updatedDate: updateEvent?.eventDate || '',
    nameservers: rdap.nameservers?.map((ns) => ns.ldhName) || [],
    dnssec: rdap.secureDNS?.delegationSigned || false,
  };
}
