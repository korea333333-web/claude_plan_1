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
      await sendTelegramMessage(chatId, '달새김 앱의 설정 → 텔레그램 연결하기 버튼을 눌러주세요.');
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

    await sendTelegramMessage(chatId, '달새김 연결 완료! 🌙\n기념일 알림을 이곳으로 보내드릴게요.');
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
