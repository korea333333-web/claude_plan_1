import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { COOKIE_NAME } from '@/lib/kakao-session';

export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/kakao/callback`;

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname,profile_image',
    state,
    prompt: 'login',
  });

  const response = NextResponse.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params}`
  );

  // Clear existing Kakao session before starting new login
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('kakao_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });

  return response;
}
