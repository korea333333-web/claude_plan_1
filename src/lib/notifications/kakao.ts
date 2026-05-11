import { Anniversary } from '@/lib/anniversary';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${w})`;
}

interface TokenResult {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

/** 카카오 토큰 갱신 */
export async function refreshKakaoToken(refreshToken: string): Promise<TokenResult | null> {
  try {
    const res = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KAKAO_REST_API_KEY!,
        refresh_token: refreshToken,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
      }),
    });

    if (!res.ok) {
      console.error('[kakao] token refresh failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token, // 만료 1개월 미만일 때만 새로 발급
      refresh_token_expires_in: data.refresh_token_expires_in,
    };
  } catch (err) {
    console.error('[kakao] token refresh error:', err);
    return null;
  }
}

function buildMessage(
  anniversary: Anniversary,
  daysUntil: number,
  nextSolarDate: Date,
  count?: { count: number; label: string } | null,
): string {
  const dateStr = formatDate(nextSolarDate);
  const lunarInfo = anniversary.date_type === 'lunar'
    ? `음력 ${anniversary.month}월 ${anniversary.day}일 → ${dateStr}`
    : dateStr;

  if (daysUntil === 0) {
    const lines = [
      `오늘은 ${anniversary.name}이에요!`,
      lunarInfo,
    ];
    if (count) lines.push(count.label);
    lines.push('', '소중한 하루 보내세요');
    return lines.join('\n');
  }

  const lines = [
    `${anniversary.name}이(가) ${daysUntil}일 남았어요`,
    lunarInfo,
  ];
  if (count) lines.push(count.label);
  lines.push('', '미리미리 준비하세요!');
  return lines.join('\n');
}

/** 카카오톡 나에게 보내기 */
export async function sendKakaoNotification(
  accessToken: string,
  anniversary: Anniversary,
  daysUntil: number,
  nextSolarDate: Date,
  count?: { count: number; label: string } | null,
): Promise<boolean> {
  const text = buildMessage(anniversary, daysUntil, nextSolarDate, count);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://claude-plan-1.vercel.app';

  const templateObject = JSON.stringify({
    object_type: 'text',
    text,
    link: {
      web_url: appUrl,
      mobile_web_url: appUrl,
    },
    button_title: '달새김에서 확인',
  });

  try {
    const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ template_object: templateObject }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[kakao] sendMessage failed:', res.status, body);
      return false;
    }

    const data = await res.json();
    return data.result_code === 0;
  } catch (err) {
    console.error('[kakao] sendMessage error:', err);
    return false;
  }
}
