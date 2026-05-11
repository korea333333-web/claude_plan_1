import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';
import crypto from 'crypto';

export async function POST() {
  try {
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

    // 2) Supabase service client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const service = createClient(url, key);

    // 3) 카카오 유저 찾기 또는 생성
    const { data: listData, error: listErr } = await service.auth.admin.listUsers();
    if (listErr) {
      return NextResponse.json({ error: '사용자 조회 실패' }, { status: 500 });
    }

    const email = `kakao_${sess.kakaoId}@dalsaegim.app`;
    let user = listData?.users?.find((u: { email?: string }) => u.email === email);

    if (!user) {
      const secret = process.env.KAKAO_SESSION_SECRET || 'fallback';
      const pw = crypto.createHmac('sha256', secret).update(`kakao_${sess.kakaoId}`).digest('hex');
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
        return NextResponse.json({ error: '사용자 생성 실패' }, { status: 500 });
      }
      user = created.user;
    }

    const userId = user.id;
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    // 4) notification_settings 조회
    const { data: row, error: selectErr } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectErr) {
      return NextResponse.json({ error: '설정 조회 실패' }, { status: 500 });
    }

    if (row?.telegram_chat_id) {
      return NextResponse.json({ alreadyConnected: true });
    }
    if (row?.telegram_connect_token) {
      const dl = `https://t.me/${botUsername}?start=${row.telegram_connect_token}`;
      return NextResponse.json({ deepLink: dl, token: row.telegram_connect_token });
    }

    // 5) 새 토큰 저장
    const token = crypto.randomBytes(16).toString('hex');

    if (row) {
      const { error: updErr } = await service
        .from('notification_settings')
        .update({ telegram_connect_token: token })
        .eq('user_id', userId);
      if (updErr) {
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    } else {
      const { error: insErr } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });
      if (insErr) {
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    }

    const deepLink = `https://t.me/${botUsername}?start=${token}`;
    return NextResponse.json({ deepLink, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[telegram-connect] ${msg.slice(0, 80)}`);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
