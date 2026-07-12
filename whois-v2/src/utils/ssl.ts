import * as tls from 'tls';

export interface SslInfo {
  valid: boolean;
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  protocol?: string;
  cipher?: string;
  serialNumber?: string;
}

export function getSslDetails(domain: string, port: number = 443): Promise<SslInfo> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port,
        rejectUnauthorized: false,
        servername: domain,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();

        if (!cert || !cert.subject) {
          resolve({ valid: false });
          return;
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysRemaining = Math.floor(
          (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        resolve({
          valid: socket.authorized || false,
          subject: cert.subject.CN || '',
          issuer: cert.issuer?.O || cert.issuer?.CN || '',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining,
          protocol: socket.getProtocol() || undefined,
          cipher: socket.getCipher()?.name || undefined,
          serialNumber: cert.serialNumber || '',
        });
      }
    );

    socket.setTimeout(5000);

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ valid: false });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ valid: false });
    });
  });
}
