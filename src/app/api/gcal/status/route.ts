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
    .select('gcal_email, gcal_connected_at, gcal_refresh_token')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({
    connected: !!data?.gcal_refresh_token,
    email: data?.gcal_email || null,
    connectedAt: data?.gcal_connected_at || null,
  });
}
