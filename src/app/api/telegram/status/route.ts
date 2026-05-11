import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ connected: false });
  }

  const service = createServiceClient();
  const { data } = await service
    .from('notification_settings')
    .select('telegram_chat_id, telegram_connected_at')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    connected: !!data?.telegram_chat_id,
    connectedAt: data?.telegram_connected_at || null,
  });
}
