import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-server';
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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  await ensureWebhook(req);

  const service = createServiceClient();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';

  const { data: existing } = await service
    .from('notification_settings')
    .select('id, telegram_connect_token, telegram_chat_id')
    .eq('user_id', user.id)
    .single();

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
      .eq('user_id', user.id);

    if (error) {
      console.error('[telegram-connect] update error:', error);
      return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
    }
  } else {
    const { error } = await service
      .from('notification_settings')
      .insert({ user_id: user.id, telegram_connect_token: token });

    if (error) {
      console.error('[telegram-connect] insert error:', error);
      return NextResponse.json({ error: '토큰 저장 실패' }, { status: 500 });
    }
  }

  const deepLink = `https://t.me/${botUsername}?start=${token}`;
  return NextResponse.json({ deepLink, token });
}
