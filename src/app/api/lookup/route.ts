import { NextRequest, NextResponse } from 'next/server';
import { performDomainLookup } from '@/utils/lookup';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { success: false, error: 'Domain name is required' },
      { status: 400 }
    );
  }

  // Basic regex to validate domain format (allows labels up to 63 chars, TLD at least 2 chars)
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  const cleanedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');

  if (!domainRegex.test(cleanedDomain)) {
    return NextResponse.json(
      { success: false, error: 'Invalid domain format. Example: google.com' },
      { status: 400 }
    );
  }

  try {
    const result = await performDomainLookup(cleanedDomain);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
