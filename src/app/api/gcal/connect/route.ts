import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: '구글 캘린더 설정이 되어있지 않습니다' }, { status: 500 });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/gcal/callback`;
    const scope = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    const response = NextResponse.json({ authUrl });
    response.cookies.set('gcal_oauth_state', state, {
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
