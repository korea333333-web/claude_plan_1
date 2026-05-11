import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('[kakao-talk] OAuth denied:', error);
    return NextResponse.redirect(`${origin}/settings?kakao_talk=error`);
  }

  // State 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get('kakao_talk_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${origin}/settings?kakao_talk=error`);
  }

  // 유저 확인
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.redirect(`${origin}/settings?kakao_talk=error`);
  }

  const redirectUri = `${origin}/api/kakao-talk/callback`;

  // 토큰 교환
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
    console.error('[kakao-talk] token exchange failed:', tokenData);
    return NextResponse.redirect(`${origin}/settings?kakao_talk=error`);
  }

  // DB에 토큰 저장
  const service = createServiceClient();
  const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const { error: upsertError } = await service
    .from('notification_settings')
    .upsert(
      {
        user_id: userId,
        kakao_access_token: tokenData.access_token,
        kakao_refresh_token: tokenData.refresh_token,
        kakao_token_expiry: expiryDate,
        kakao_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('[kakao-talk] DB upsert failed:', upsertError);
    return NextResponse.redirect(`${origin}/settings?kakao_talk=error`);
  }

  // State 쿠키 삭제
  const response = NextResponse.redirect(`${origin}/settings?kakao_talk=success`);
  response.cookies.set('kakao_talk_oauth_state', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
