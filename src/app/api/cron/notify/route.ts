import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { Anniversary, AlarmConfig, getNextOccurrence, calculateCount } from '@/lib/anniversary';
import { sendTelegramNotification } from '@/lib/notifications/telegram';
import { refreshAccessToken, createCalendarEvent } from '@/lib/notifications/google-calendar';

/** KST 기준 오늘 날짜 구하기 (Vercel은 UTC) */
function getTodayKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
}

/** 두 날짜가 같은 날인지 비교 */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export async function GET(req: NextRequest) {
  // 인증: Vercel Cron 또는 CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const vercelCron = req.headers.get('x-vercel-cron');

  // Vercel Cron에서 호출하거나, CRON_SECRET이 맞거나, 개발환경
  if (!vercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const todayKST = getTodayKST();

  const stats = { checked: 0, telegramSent: 0, gcalCreated: 0, errors: 0 };

  try {
    // 1. 모든 기념일 조회
    const { data: anniversaries, error: annErr } = await service
      .from('anniversaries')
      .select('*');

    if (annErr || !anniversaries) {
      console.error('[cron] failed to fetch anniversaries:', annErr);
      return NextResponse.json({ error: 'DB error', stats }, { status: 500 });
    }

    // 2. 유저별로 그룹화
    const userAnniversaries = new Map<string, Anniversary[]>();
    for (const ann of anniversaries) {
      const list = userAnniversaries.get(ann.user_id) || [];
      list.push(ann);
      userAnniversaries.set(ann.user_id, list);
    }

    // 3. 각 유저별로 처리
    for (const [userId, anns] of userAnniversaries) {
      // 유저의 알림 설정 조회
      const { data: settings } = await service
        .from('notification_settings')
        .select('telegram_chat_id, gcal_refresh_token, gcal_access_token, gcal_token_expiry')
        .eq('user_id', userId)
        .maybeSingle();

      const hasTelegram = !!settings?.telegram_chat_id;
      const hasGcal = !!settings?.gcal_refresh_token;

      // 알림 채널이 하나도 없으면 스킵
      if (!hasTelegram && !hasGcal) continue;

      // Google 토큰 갱신 (필요시)
      let gcalAccessToken = settings?.gcal_access_token || null;
      if (hasGcal && settings?.gcal_token_expiry) {
        const expiry = new Date(settings.gcal_token_expiry);
        if (expiry.getTime() < Date.now() + 5 * 60 * 1000) {
          const newToken = await refreshAccessToken(settings.gcal_refresh_token!);
          if (newToken) {
            gcalAccessToken = newToken.access_token;
            await service
              .from('notification_settings')
              .update({
                gcal_access_token: newToken.access_token,
                gcal_token_expiry: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
              })
              .eq('user_id', userId);
          } else {
            gcalAccessToken = null;
          }
        }
      }

      // 각 기념일 처리
      for (const ann of anns) {
        stats.checked++;

        const alarms: AlarmConfig[] = ann.alarms || [
          { enabled: true, daysBefore: 7, hour: 9, minute: 0 },
          { enabled: true, daysBefore: 3, hour: 9, minute: 0 },
          { enabled: true, daysBefore: 0, hour: 9, minute: 0 },
        ];

        const nextDate = getNextOccurrence(ann, todayKST);
        const count = calculateCount(ann, nextDate);

        for (let alarmIdx = 0; alarmIdx < alarms.length; alarmIdx++) {
          const alarm = alarms[alarmIdx];
          if (!alarm.enabled) continue;

          // 알림 날짜 계산: 기념일 - daysBefore
          const notifyDate = new Date(nextDate);
          notifyDate.setDate(notifyDate.getDate() - alarm.daysBefore);

          // 오늘이 알림 날짜가 아니면 스킵
          if (!isSameDay(todayKST, notifyDate)) continue;

          const daysUntil = alarm.daysBefore;
          const targetDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

          // --- 텔레그램 발송 ---
          if (hasTelegram) {
            // 중복 체크
            const { data: existing } = await service
              .from('notification_log')
              .select('id')
              .eq('anniversary_id', ann.id)
              .eq('alarm_index', alarmIdx)
              .eq('target_date', targetDateStr)
              .eq('channel', 'telegram')
              .maybeSingle();

            if (!existing) {
              const ok = await sendTelegramNotification(
                settings!.telegram_chat_id,
                ann,
                daysUntil,
                nextDate,
                count,
              );
              if (ok) {
                await service.from('notification_log').insert({
                  anniversary_id: ann.id,
                  user_id: userId,
                  alarm_index: alarmIdx,
                  target_date: targetDateStr,
                  channel: 'telegram',
                });
                stats.telegramSent++;
              } else {
                stats.errors++;
              }
            }
          }

          // --- 구글 캘린더 등록 ---
          // 구글 캘린더는 기념일 당일 일정을 한번만 생성 (첫 알림 시)
          if (gcalAccessToken) {
            const { data: existingGcal } = await service
              .from('notification_log')
              .select('id')
              .eq('anniversary_id', ann.id)
              .eq('target_date', targetDateStr)
              .eq('channel', 'google_calendar')
              .maybeSingle();

            if (!existingGcal) {
              const eventId = await createCalendarEvent(
                gcalAccessToken,
                ann,
                nextDate,
                alarms,
                count,
              );
              if (eventId) {
                await service.from('notification_log').insert({
                  anniversary_id: ann.id,
                  user_id: userId,
                  alarm_index: alarmIdx,
                  target_date: targetDateStr,
                  channel: 'google_calendar',
                });
                stats.gcalCreated++;
              } else {
                stats.errors++;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      date: todayKST.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('[cron] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error', stats }, { status: 500 });
  }
}
