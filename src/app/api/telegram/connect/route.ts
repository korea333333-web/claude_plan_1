import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

async function ensureWebhook(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyLen = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
    console.log(`[TC0] serviceKey=${hasServiceKey} len=${keyLen}`);

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.log('[TC1] no userId, returning 401');
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }
    console.log(`[TC1] uid=${userId.slice(0, 8)}`);

    await ensureWebhook(req);

    const service = createServiceClient();
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

    const { data: existing, error: selectErr } = await service
      .from('notification_settings')
      .select('id, telegram_connect_token, telegram_chat_id')
      .eq('user_id', userId)
      .single();

    console.log(`[TC2] select: data=${!!existing} err=${selectErr?.code || 'none'}`);

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
        console.error(`[TC3] UPDATE fail: ${error.code} ${error.message}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
      console.log('[TC3] UPDATE ok');
    } else {
      const { error } = await service
        .from('notification_settings')
        .insert({ user_id: userId, telegram_connect_token: token });

      if (error) {
        console.error(`[TC3] INSERT fail: ${error.code} ${error.message}`);
        return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
      }
      console.log('[TC3] INSERT ok');
    }

    const deepLink = `https://t.me/${botUsername}?start=${token}`;
    console.log('[TC4] done');
    return NextResponse.json({ deepLink, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[TC-CRASH] ${msg}`);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
