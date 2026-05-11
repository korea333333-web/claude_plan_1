import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';
import crypto from 'crypto';

export async function POST() {
  try {
    console.log('[C1] start');

    // Step 1: 카카오 세션에서 직접 사용자 확인 (Supabase auth 우회)
    const cookieStore = await cookies();
    const kakaoSessionCookie = cookieStore.get(COOKIE_NAME);

    if (!kakaoSessionCookie?.value) {
      console.log('[C2] no cookie');
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const session = verifySession(kakaoSessionCookie.value);
    if (!session) {
      console.log('[C2] bad session');
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    console.log(`[C2] kakao=${session.kakaoId}`);

    // Step 2: 서비스 클라이언트로 유저 찾기
    const service = createServiceClient();
    const email = `kakao_${session.kakaoId}@dalsaegim.app`;

    const { data: listData } = await service.auth.admin.listUsers();
    const existing = listData?.users?.find((u: { email?: string }) => u.email === email);

    if (!existing) {
      console.log('[C3] user not found');
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 401 });
    }

    const userId = existing.id;
    console.log(`[C3] uid=${userId.slice(0, 8)}`);

    // Step 3: notification_settings 조회
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    const { data: row, error: selErr } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .single();

    console.log(`[C4] row=${!!row} err=${selErr?.code || 'none'}`);

    if (row?.telegram_chat_id) {
      return NextResponse.json({ alreadyConnected: true });
    }

    if (row?.telegram_connect_token) {
      const deepLink = `https://t.me/${botUsername}?start=${row.telegram_connect_token}`;
      return NextResponse.json({ deepLink, token: row.telegram_connect_token });
    }

    // Step 4: 새 토큰 생성 + 저장
    const token = crypto.randomBytes(16).toString('hex');

    if (row) {
      const { error } = await service
        .from('notification_settings')
        .update({ telegram_connect_token: token })
        .eq('user_id', userId);

      if (error) {
        console.error(`[C5] upd: ${error.code}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    } else {
      const { error } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });

      if (error) {
        console.error(`[C5] ins: ${error.code} ${error.message.slice(0, 40)}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    }

    console.log('[C6] done');
    const deepLink = `https://t.me/${botUsername}?start=${token}`;
    return NextResponse.json({ deepLink, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[C-ERR] ${msg.slice(0, 80)}`);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
