import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const service = createServiceClient();

  const { data: existing } = await service
    .from('notification_settings')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    await service
      .from('notification_settings')
      .update({ telegram_connect_token: token })
      .eq('user_id', user.id);
  } else {
    await service
      .from('notification_settings')
      .insert({ user_id: user.id, telegram_connect_token: token });
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'dalsaegim_bot';
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return NextResponse.json({ deepLink });
}
