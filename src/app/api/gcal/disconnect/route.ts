import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const service = createServiceClient();

    // Revoke Google token if exists
    const { data: row } = await service
      .from('notification_settings')
      .select('gcal_refresh_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (row?.gcal_refresh_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${row.gcal_refresh_token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch { /* revoke 실패해도 DB는 정리 */ }
    }

    const { error } = await service
      .from('notification_settings')
      .update({
        gcal_refresh_token: null,
        gcal_access_token: null,
        gcal_token_expiry: null,
        gcal_email: null,
        gcal_connected_at: null,
      })
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: '해제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
