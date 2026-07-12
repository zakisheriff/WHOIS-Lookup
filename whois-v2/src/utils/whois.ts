import * as net from 'net';

export interface WhoisResult {
  raw: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  status?: string[];
  registrant?: string;
}

function parseWhoisField(text: string, field: string): string | undefined {
  const patterns = [
    new RegExp(`${field}\\s*:\\s*(.+)`, 'i'),
    new RegExp(`\\[${field}\\]\\s*(.+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function parseNameServers(text: string): string[] {
  const servers: string[] = [];
  const patterns = [
    /(?:Name Server|nserver|NS)\s*:\s*(.+)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const ns = match[1].trim().toLowerCase();
      if (!servers.includes(ns)) servers.push(ns);
    }
  }
  return servers;
}

function parseStatus(text: string): string[] {
  const statuses: string[] = [];
  const pattern = /(?:Domain Status|Status)\s*:\s*(.+)/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    statuses.push(match[1].trim());
  }
  return statuses;
}

export function parseWhoisData(raw: string): Partial<WhoisResult> {
  return {
    registrar: parseWhoisField(raw, 'Registrar') || parseWhoisField(raw, 'registrar'),
    creationDate: parseWhoisField(raw, 'Creation Date') || parseWhoisField(raw, 'created'),
    expirationDate: parseWhoisField(raw, 'Expir') || parseWhoisField(raw, 'Registry Expiry Date'),
    updatedDate: parseWhoisField(raw, 'Updated') || parseWhoisField(raw, 'Last Modified'),
    nameServers: parseNameServers(raw),
    status: parseStatus(raw),
    registrant: parseWhoisField(raw, 'Registrant') || parseWhoisField(raw, 'organization'),
  };
}

export function queryWhoisRaw(domain: string, server: string = 'whois.iana.org'): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';
    const timeout = 8000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('end', () => {
      resolve(data);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('WHOIS query timed out'));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.connect(43, server);
  });
}

export async function getRecursiveWhois(domain: string): Promise<string> {
  const initialResponse = await queryWhoisRaw(domain, 'whois.iana.org');

  const referMatch = initialResponse.match(/(?:refer|whois)\s*:\s*(\S+)/i);
  if (referMatch) {
    const referredServer = referMatch[1].trim();
    try {
      const finalResponse = await queryWhoisRaw(domain, referredServer);
      return finalResponse;
    } catch {
      return initialResponse;
    }
  }

  return initialResponse;
}
