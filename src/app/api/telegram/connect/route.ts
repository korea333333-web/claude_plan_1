import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  try {
    console.log('[TC0] start');

    let userId: string | null = null;
    try {
      userId = await getAuthenticatedUserId();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[TC0.5] auth err: ${msg.slice(0, 60)}`);
    }

    if (!userId) {
      console.log('[TC1] no userId');
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    console.log(`[TC1] uid=${userId.slice(0, 8)}`);

    const service = createServiceClient();
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    const { data: existing, error: selectErr } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .single();

    console.log(`[TC2] sel=${!!existing} err=${selectErr?.code || 'none'}`);

    if (existing?.telegram_chat_id) {
      return NextResponse.json({ alreadyConnected: true });
    }

    if (existing?.telegram_connect_token) {
      const deepLink = `https://t.me/${botUsername}?start=${existing.telegram_connect_token}`;
      return NextResponse.json({ deepLink, token: existing.telegram_connect_token });
    }

    const token = crypto.randomBytes(16).toString('hex');

    if (existing) {
      const { error } = await service
        .from('notification_settings')
        .update({ telegram_connect_token: token })
        .eq('user_id', userId);

      if (error) {
        console.error(`[TC3] upd fail: ${error.code}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    } else {
      const { error } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });

      if (error) {
        console.error(`[TC3] ins fail: ${error.code} ${error.message.slice(0, 50)}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
    }

    console.log('[TC4] ok');
    const deepLink = `https://t.me/${botUsername}?start=${token}`;
    return NextResponse.json({ deepLink, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[TC-CRASH] ${msg.slice(0, 80)}`);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
