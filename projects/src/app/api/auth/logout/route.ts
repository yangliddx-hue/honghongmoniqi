import { NextResponse } from 'next/server';
import { COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

function buildExpiredCookieHeader(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=${COOKIE_OPTIONS.path}`,
    'Max-Age=0',
    'HttpOnly',
    `SameSite=${COOKIE_OPTIONS.sameSite === 'none' ? 'None' : 'Lax'}`,
  ];

  if (COOKIE_OPTIONS.secure) {
    parts.push('Secure');
  }

  if (COOKIE_OPTIONS.partitioned) {
    parts.push('Partitioned');
  }

  return parts.join('; ');
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieValue = buildExpiredCookieHeader();
  response.headers.set('Set-Cookie', cookieValue);
  return response;
}
