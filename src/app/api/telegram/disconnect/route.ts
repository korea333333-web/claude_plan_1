import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from('notification_settings')
      .update({
        telegram_chat_id: null,
        telegram_connected_at: null,
        telegram_connect_token: null,
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
