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
      return NextResponse.json({ error: 'ERR1: 카카오 쿠키 없음' }, { status: 401 });
    }
    const sess = verifySession(kc.value);
    if (!sess) {
      return NextResponse.json({ error: 'ERR2: 세션 검증 실패' }, { status: 401 });
    }

    // 2) 환경변수 확인
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({
        error: `ERR3: 환경변수 누락 url=${!!url} key=${!!key} keyLen=${key?.length}`
      }, { status: 500 });
    }

    const service = createClient(url, key);

    // 3) admin.listUsers 테스트
    const { data: listData, error: listErr } = await service.auth.admin.listUsers();
    if (listErr) {
      return NextResponse.json({
        error: `ERR4: listUsers 실패 - ${listErr.message}`
      }, { status: 500 });
    }

    const email = `kakao_${sess.kakaoId}@dalsaegim.app`;
    let user = listData?.users?.find((u: { email?: string }) => u.email === email);

    // 4) 유저 없으면 생성
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
      if (createErr) {
        return NextResponse.json({
          error: `ERR5: createUser 실패 - ${createErr.message}`
        }, { status: 500 });
      }
      if (!created?.user) {
        return NextResponse.json({
          error: 'ERR6: createUser 반환값 없음'
        }, { status: 500 });
      }
      user = created.user;
    }

    const userId = user.id;

    // 5) notification_settings 조회
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    const { data: row, error: selectErr } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectErr) {
      return NextResponse.json({
        error: `ERR7: SELECT 실패 - ${selectErr.message}`
      }, { status: 500 });
    }

    if (row?.telegram_chat_id) {
      return NextResponse.json({ alreadyConnected: true });
    }
    if (row?.telegram_connect_token) {
      const dl = `https://t.me/${botUsername}?start=${row.telegram_connect_token}`;
      return NextResponse.json({ deepLink: dl, token: row.telegram_connect_token });
    }

    // 6) 새 토큰 저장
    const token = crypto.randomBytes(16).toString('hex');

    if (row) {
      const { error: updErr } = await service
        .from('notification_settings')
        .update({ telegram_connect_token: token })
        .eq('user_id', userId);
      if (updErr) {
        return NextResponse.json({
          error: `ERR8: UPDATE 실패 - ${updErr.message}`
        }, { status: 500 });
      }
    } else {
      const { error: insErr } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });
      if (insErr) {
        return NextResponse.json({
          error: `ERR9: INSERT 실패 - ${insErr.message} (userId=${userId.slice(0,8)})`
        }, { status: 500 });
      }
    }

    console.log(`[OK] telegram connect done for ${userId.slice(0,8)}`);
    const deepLink = `https://t.me/${botUsername}?start=${token}`;
    return NextResponse.json({ deepLink, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: `ERR-CATCH: ${msg.slice(0, 120)}`
    }, { status: 500 });
  }
}
