import { Anniversary, AlarmConfig } from '@/lib/anniversary';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${w})`;
}

function buildMessage(anniversary: Anniversary, daysUntil: number, nextSolarDate: Date, count?: { count: number; label: string } | null): string {
  const dateStr = formatDate(nextSolarDate);
  const lunarInfo = anniversary.date_type === 'lunar'
    ? `\n📅 음력 ${anniversary.month}월 ${anniversary.day}일 → ${dateStr}`
    : `\n📅 ${dateStr}`;

  if (daysUntil === 0) {
    const lines = [
      `🎉 오늘은 ${anniversary.name}이에요!`,
      lunarInfo,
    ];
    if (count) lines.push(`🎂 ${count.label}`);
    lines.push('', '소중한 하루 보내세요 ✨');
    return lines.join('\n');
  }

  const lines = [
    `🌙 ${anniversary.name}이(가) ${daysUntil}일 남았어요`,
    lunarInfo,
  ];
  if (count) lines.push(`🎂 ${count.label}`);
  lines.push('', '미리미리 준비하세요!');
  return lines.join('\n');
}

export async function sendTelegramNotification(
  chatId: string,
  anniversary: Anniversary,
  daysUntil: number,
  nextSolarDate: Date,
  count?: { count: number; label: string } | null,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[notify-telegram] TELEGRAM_BOT_TOKEN not set');
    return false;
  }

  const text = buildMessage(anniversary, daysUntil, nextSolarDate, count);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[notify-telegram] sendMessage failed:', res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[notify-telegram] error:', err);
    return false;
  }
}
