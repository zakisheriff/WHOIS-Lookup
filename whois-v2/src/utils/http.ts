export interface HttpInfo {
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
}

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

function calculateGrade(headers: Record<string, string>): string {
  let score = 0;
  if (headers['strict-transport-security']) score++;
  if (headers['content-security-policy']) score++;
  if (headers['x-frame-options']) score++;
  if (headers['x-content-type-options']) score++;
  if (headers['referrer-policy']) score++;
  if (headers['permissions-policy']) score++;

  if (score === 6) return 'A+';
  if (score === 5) return 'A';
  if (score === 4) return 'B';
  if (score === 3) return 'C';
  if (score === 2) return 'D';
  return 'F';
}

export async function inspectHttp(domain: string): Promise<HttpInfo> {
  const result: HttpInfo = {
    redirectChain: [],
    headers: {},
    securityHeaders: {
      hsts: false,
      csp: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      referrerPolicy: false,
      permissionsPolicy: false,
    },
    securityGrade: 'F',
  };

  let currentUrl = `https://${domain}`;
  const maxRedirects = 5;

  for (let i = 0; i <= maxRedirects; i++) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { 'User-Agent': 'WHOIS-Lookup/1.0' },
      });

      result.statusCode = response.status;
      result.server = response.headers.get('server') || undefined;

      response.headers.forEach((value, key) => {
        result.headers[key.toLowerCase()] = value;
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (location) {
          result.redirectChain.push(currentUrl);
          currentUrl = location.startsWith('http')
            ? location
            : new URL(location, `https://${domain}`).toString();
          continue;
        }
      }

      break;
    } catch {
      break;
    }
  }

  result.redirectChain.push(currentUrl);

  result.securityHeaders.hsts = !!result.headers['strict-transport-security'];
  result.securityHeaders.csp = !!result.headers['content-security-policy'];
  result.securityHeaders.xFrameOptions = !!result.headers['x-frame-options'];
  result.securityHeaders.xContentTypeOptions = !!result.headers['x-content-type-options'];
  result.securityHeaders.referrerPolicy = !!result.headers['referrer-policy'];
  result.securityHeaders.permissionsPolicy = !!result.headers['permissions-policy'];

  result.securityGrade = calculateGrade(result.headers);

  return result;
}
