import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSessionValue, COOKIE_NAME } from '@/lib/kakao-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_denied`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get('kakao_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=kakao_state_mismatch`);
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;

  // 1. Exchange code for Kakao access token
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('[kakao-auth] token exchange failed:', tokenData);
    return NextResponse.redirect(`${origin}/login?error=kakao_token_failed`);
  }

  // 2. Get user info from Kakao
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const kakaoUser = await userRes.json();
  const kakaoId = kakaoUser.id;
  const nickname =
    kakaoUser.properties?.nickname ||
    kakaoUser.kakao_account?.profile?.nickname ||
    '사용자';
  const profileImage =
    kakaoUser.properties?.profile_image ||
    kakaoUser.kakao_account?.profile?.profile_image_url ||
    '';

  if (!kakaoId) {
    return NextResponse.redirect(`${origin}/login?error=kakao_user_failed`);
  }

  // 3. Create self-managed session cookie
  const sessionValue = createSessionValue({
    kakaoId: String(kakaoId),
    nickname,
    profileImage,
  });

  const response = NextResponse.redirect(`${origin}/`);

  response.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  // Clean up state cookie
  response.cookies.set('kakao_oauth_state', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
