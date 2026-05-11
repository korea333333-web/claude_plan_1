import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    if (!text.startsWith('/start')) return NextResponse.json({ ok: true });

    const token = text.replace('/start', '').trim();
    if (!token) {
      await sendTelegramMessage(chatId, '🌙 달새김 알림봇이에요!\n\n달새김 앱의 설정 → 텔레그램 「연결하기」 버튼을 눌러주세요.\n\n그러면 자동으로 연결됩니다!');
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('notification_settings')
      .update({
        telegram_chat_id: chatId,
        telegram_connected_at: new Date().toISOString(),
        telegram_connect_token: null,
      })
      .eq('telegram_connect_token', token)
      .select('user_id')
      .single();

    if (error || !data) {
      await sendTelegramMessage(chatId, '연결 토큰이 만료되었거나 잘못되었어요. 앱에서 다시 시도해주세요.');
      return NextResponse.json({ ok: true });
    }

    const welcomeMsg = [
      '🌙 달새김 연결을 축하합니다!',
      '',
      '달새김은 음력/양력 기념일을 등록하면',
      '자동으로 미리 알려주는 서비스예요.',
      '',
      '소중한 기념일을 잊지 마세요!',
      '',
      '━━━━━━━━━━━━━━━━',
      '',
      '📌 이런 알림을 보내드려요:',
      '',
      '🌙 어머니 생신이 7일 남았어요',
      '📅 음력 4.15 → 양력 5월 18일 (월)',
      '🎂 73번째 생신',
      '',
      '🌙 어머니 생신이 3일 남았어요',
      '📅 5월 18일 (월)',
      '준비할 건 없으신가요?',
      '',
      '🎉 오늘은 어머니 생신이에요!',
      '📅 음력 4.15 → 양력 5월 18일',
      '🎂 73번째 생신',
      '좋은 하루 되세요 🌙',
      '',
      '━━━━━━━━━━━━━━━━',
      '',
      '이제 이곳으로 알림이 와요! 🎉',
    ].join('\n');

    await sendTelegramMessage(chatId, welcomeMsg);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
