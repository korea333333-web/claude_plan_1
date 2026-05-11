import { Anniversary, AlarmConfig } from '@/lib/anniversary';

interface TokenResult {
  access_token: string;
  expires_in: number;
}

/** Google OAuth 토큰 갱신 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResult | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      console.error('[gcal] token refresh failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return { access_token: data.access_token, expires_in: data.expires_in };
  } catch (err) {
    console.error('[gcal] token refresh error:', err);
    return null;
  }
}

/** 구글 캘린더에 기념일 일정 생성 */
export async function createCalendarEvent(
  accessToken: string,
  anniversary: Anniversary,
  nextSolarDate: Date,
  alarms?: AlarmConfig[],
  count?: { count: number; label: string } | null,
): Promise<string | null> {
  // 종일 이벤트용 날짜 (YYYY-MM-DD)
  const dateStr = [
    nextSolarDate.getFullYear(),
    String(nextSolarDate.getMonth() + 1).padStart(2, '0'),
    String(nextSolarDate.getDate()).padStart(2, '0'),
  ].join('-');

  // 다음날 (종일 이벤트 end)
  const endDate = new Date(nextSolarDate);
  endDate.setDate(endDate.getDate() + 1);
  const endStr = [
    endDate.getFullYear(),
    String(endDate.getMonth() + 1).padStart(2, '0'),
    String(endDate.getDate()).padStart(2, '0'),
  ].join('-');

  // 설명 텍스트
  const descLines: string[] = [];
  if (anniversary.date_type === 'lunar') {
    descLines.push(`음력 ${anniversary.month}월 ${anniversary.day}일`);
  }
  if (count) {
    descLines.push(count.label);
  }
  descLines.push('', '달새김에서 자동 등록된 일정입니다.');

  // 알림 리마인더 (enabled된 알람만)
  const reminders: { method: string; minutes: number }[] = [];
  if (alarms) {
    for (const alarm of alarms) {
      if (alarm.enabled) {
        // daysBefore * 24 * 60 = 분으로 변환 (종일 이벤트 기준)
        const minutes = alarm.daysBefore * 24 * 60;
        reminders.push({ method: 'popup', minutes });
      }
    }
  }
  // 리마인더가 없으면 기본 7일전, 당일
  if (reminders.length === 0) {
    reminders.push({ method: 'popup', minutes: 7 * 24 * 60 });
    reminders.push({ method: 'popup', minutes: 0 });
  }

  const event = {
    summary: anniversary.name,
    description: descLines.join('\n'),
    start: { date: dateStr },
    end: { date: endStr },
    reminders: {
      useDefault: false,
      overrides: reminders,
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[gcal] createEvent failed:', res.status, body);
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('[gcal] createEvent error:', err);
    return null;
  }
}
