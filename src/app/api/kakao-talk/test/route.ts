import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';
import { refreshKakaoToken, sendKakaoNotification } from '@/lib/notifications/kakao';
import { Anniversary } from '@/lib/anniversary';

export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: settings } = await service
      .from('notification_settings')
      .select('kakao_access_token, kakao_refresh_token, kakao_token_expiry')
      .eq('user_id', userId)
      .maybeSingle();

    if (!settings?.kakao_refresh_token) {
      return NextResponse.json({ error: '카카오톡 미연결' }, { status: 400 });
    }

    // 토큰 갱신 필요 시
    let accessToken = settings.kakao_access_token;
    if (settings.kakao_token_expiry) {
      const expiry = new Date(settings.kakao_token_expiry);
      if (expiry.getTime() < Date.now() + 5 * 60 * 1000) {
        const newToken = await refreshKakaoToken(settings.kakao_refresh_token);
        if (newToken) {
          accessToken = newToken.access_token;
          await service
            .from('notification_settings')
            .update({
              kakao_access_token: newToken.access_token,
              kakao_token_expiry: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
            })
            .eq('user_id', userId);
        } else {
          return NextResponse.json({ error: '토큰 갱신 실패' }, { status: 500 });
        }
      }
    }

    // 테스트용 가짜 기념일
    const testAnn: Anniversary = {
      id: 'test',
      user_id: userId,
      name: '달새김 테스트 알림',
      date_type: 'solar',
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      category: 'custom',
      repeat_type: 'yearly',
      start_year: null,
      is_shared: false,
      is_leap_month: false,
      alarms: [],
      created_at: new Date().toISOString(),
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ok = await sendKakaoNotification(
      accessToken!,
      testAnn,
      1, // 1일 남음
      tomorrow,
      { count: 1, label: '첫 번째 테스트' },
    );

    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('[kakao-test] error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
