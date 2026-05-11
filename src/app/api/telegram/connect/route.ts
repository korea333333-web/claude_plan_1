import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';
import crypto from 'crypto';

export async function POST() {
  try {
    console.log('[C1] start');

    // 1) 카카오 세션 확인
    const cookieStore = await cookies();
    const kc = cookieStore.get(COOKIE_NAME);
    if (!kc?.value) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    const sess = verifySession(kc.value);
    if (!sess) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    console.log(`[C2] k=${sess.kakaoId}`);

    // 2) Supabase 유저 찾기 또는 생성
    const service = createServiceClient();
    const email = `kakao_${sess.kakaoId}@dalsaegim.app`;
    const secret = process.env.KAKAO_SESSION_SECRET || 'fallback';
    const pw = crypto.createHmac('sha256', secret).update(`kakao_${sess.kakaoId}`).digest('hex');

    const { data: listData } = await service.auth.admin.listUsers();
    let user = listData?.users?.find((u: { email?: string }) => u.email === email);

    if (!user) {
      console.log('[C3] creating user');
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email,
        password: pw,
        email_confirm: true,
        user_metadata: {
          full_name: sess.nickname,
          avatar_url: sess.profileImage,
          provider: 'kakao',
          kakao_id: sess.kakaoId,
        },
      });
      if (createErr || !created?.user) {
        console.error(`[C3] fail: ${createErr?.message?.slice(0, 50)}`);
        return NextResponse.json({ error: '사용자 생성 실패' }, { status: 500 });
      }
      user = created.user;
      console.log(`[C3] created=${user.id.slice(0, 8)}`);
    } else {
      console.log(`[C3] found=${user.id.slice(0, 8)}`);
    }

    const userId = user.id;

    // 3) notification_settings 조회/생성
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    const { data: row } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (row?.telegram_chat_id) {
      return NextResponse.json({ alreadyConnected: true });
    }
    if (row?.telegram_connect_token) {
      const dl = `https://t.me/${botUsername}?start=${row.telegram_connect_token}`;
      return NextResponse.json({ deepLink: dl, token: row.telegram_connect_token });
    }

    // 4) 새 토큰 저장
    const token = crypto.randomBytes(16).toString('hex');

    if (row) {
      const { error } = await service
        .from('notification_settings')
        .update({ telegram_connect_token: token })
        .eq('user_id', userId);
      if (error) {
        console.error(`[C5] upd: ${error.message.slice(0, 40)}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    } else {
      const { error } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });
      if (error) {
        console.error(`[C5] ins: ${error.message.slice(0, 40)}`);
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
