import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const { data } = await supabase
    .from('notification_settings')
    .select('telegram_chat_id, telegram_connected_at')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    connected: !!data?.telegram_chat_id,
    connectedAt: data?.telegram_connected_at || null,
  });
}
