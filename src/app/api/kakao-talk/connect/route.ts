import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const clientId = process.env.KAKAO_REST_API_KEY;
    if (!clientId) {
      return NextResponse.json({ error: '카카오 설정이 되어있지 않습니다' }, { status: 500 });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/kakao-talk/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'talk_message',
      state,
    });

    const authUrl = `https://kauth.kakao.com/oauth/authorize?${params}`;

    const response = NextResponse.json({ authUrl });
    response.cookies.set('kakao_talk_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
