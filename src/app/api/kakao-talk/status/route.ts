import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ connected: false });
    }

    const service = createServiceClient();
    const { data } = await service
      .from('notification_settings')
      .select('kakao_refresh_token, kakao_connected_at')
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      connected: !!data?.kakao_refresh_token,
      connectedAt: data?.kakao_connected_at || null,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
