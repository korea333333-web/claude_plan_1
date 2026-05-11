import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/kakao/callback`;

  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname,profile_image',
  });

  return NextResponse.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params}`
  );
}
