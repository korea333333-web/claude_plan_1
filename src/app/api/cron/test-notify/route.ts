import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { Anniversary, AlarmConfig, getNextOccurrence, calculateCount } from '@/lib/anniversary';
import { sendTelegramNotification } from '@/lib/notifications/telegram';
import { refreshAccessToken, createCalendarEvent } from '@/lib/notifications/google-calendar';

/**
 * 테스트 전용 엔드포인트 — 프로덕션 배포 후 삭제할 것
 * 기능: 크론 알림 로직을 수동으로 실행하고 결과를 반환
 * ?dryrun=true 로 호출하면 실제 발송 없이 매칭 결과만 확인
 */

function getTodayKST(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export async function GET(req: NextRequest) {
  const isDryRun = req.nextUrl.searchParams.get('dryrun') === 'true';
  const testSecret = req.nextUrl.searchParams.get('secret');

  // 간단한 보호: CRON_SECRET 또는 하드코딩된 테스트키
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && testSecret !== cronSecret && testSecret !== 'dalsaegim-test-2026') {
    return NextResponse.json({ error: 'Unauthorized. Pass ?secret=YOUR_CRON_SECRET' }, { status: 401 });
  }

  const service = createServiceClient();
  const todayKST = getTodayKST();

  const debugInfo: Record<string, unknown>[] = [];
  const stats = { checked: 0, matched: 0, telegramSent: 0, gcalCreated: 0, errors: 0 };

  try {
    // 1. 모든 기념일 조회
    const { data: anniversaries, error: annErr } = await service
      .from('anniversaries')
      .select('*');

    if (annErr || !anniversaries) {
      return NextResponse.json({
        error: 'DB error fetching anniversaries',
        detail: annErr?.message,
        stats,
      }, { status: 500 });
    }

    debugInfo.push({ totalAnniversaries: anniversaries.length });

    // 2. 유저별 그룹화
    const userAnniversaries = new Map<string, Anniversary[]>();
    for (const ann of anniversaries) {
      const list = userAnniversaries.get(ann.user_id) || [];
      list.push(ann);
      userAnniversaries.set(ann.user_id, list);
    }

    debugInfo.push({ totalUsers: userAnniversaries.size });

    // 3. 각 유저별로 처리
    for (const [userId, anns] of userAnniversaries) {
      const { data: settings } = await service
        .from('notification_settings')
        .select('telegram_chat_id, gcal_refresh_token, gcal_access_token, gcal_token_expiry')
        .eq('user_id', userId)
        .maybeSingle();

      const hasTelegram = !!settings?.telegram_chat_id;
      const hasGcal = !!settings?.gcal_refresh_token;

      const userDebug: Record<string, unknown> = {
        userId: userId.substring(0, 8) + '...',
        hasTelegram,
        hasGcal,
        anniversaryCount: anns.length,
        matches: [] as Record<string, unknown>[],
      };

      if (!hasTelegram && !hasGcal) {
        userDebug.skipped = 'no notification channels';
        debugInfo.push(userDebug);
        continue;
      }

      // Google 토큰 갱신
      let gcalAccessToken = settings?.gcal_access_token || null;
      if (hasGcal && settings?.gcal_token_expiry) {
        const expiry = new Date(settings.gcal_token_expiry);
        if (expiry.getTime() < Date.now() + 5 * 60 * 1000) {
          if (!isDryRun) {
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
              userDebug.gcalTokenRefreshed = true;
            } else {
              gcalAccessToken = null;
              userDebug.gcalTokenRefreshFailed = true;
            }
          } else {
            userDebug.gcalTokenExpired = true;
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

        const annDebug: Record<string, unknown> = {
          name: ann.name,
          dateType: ann.date_type,
          nextSolarDate: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
          count: count?.label || null,
          alarmMatches: [] as Record<string, unknown>[],
        };

        for (let alarmIdx = 0; alarmIdx < alarms.length; alarmIdx++) {
          const alarm = alarms[alarmIdx];
          if (!alarm.enabled) continue;

          const notifyDate = new Date(nextDate);
          notifyDate.setDate(notifyDate.getDate() - alarm.daysBefore);

          const notifyDateStr = `${notifyDate.getFullYear()}-${String(notifyDate.getMonth() + 1).padStart(2, '0')}-${String(notifyDate.getDate()).padStart(2, '0')}`;
          const isToday = isSameDay(todayKST, notifyDate);

          if (isToday) {
            stats.matched++;
            const targetDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

            const matchInfo: Record<string, unknown> = {
              alarmIndex: alarmIdx,
              daysBefore: alarm.daysBefore,
              notifyDate: notifyDateStr,
              isMatch: true,
            };

            if (!isDryRun) {
              // 텔레그램 발송
              if (hasTelegram) {
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
                    alarm.daysBefore,
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
                    matchInfo.telegramSent = true;
                  } else {
                    stats.errors++;
                    matchInfo.telegramError = true;
                  }
                } else {
                  matchInfo.telegramSkipped = 'already sent';
                }
              }

              // 구글 캘린더 등록
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
                    matchInfo.gcalCreated = true;
                    matchInfo.gcalEventId = eventId;
                  } else {
                    stats.errors++;
                    matchInfo.gcalError = true;
                  }
                } else {
                  matchInfo.gcalSkipped = 'already created';
                }
              }
            }

            (annDebug.alarmMatches as Record<string, unknown>[]).push(matchInfo);
          }
        }

        if ((annDebug.alarmMatches as Record<string, unknown>[]).length > 0) {
          (userDebug.matches as Record<string, unknown>[]).push(annDebug);
        }
      }

      debugInfo.push(userDebug);
    }

    return NextResponse.json({
      success: true,
      isDryRun,
      todayKST: `${todayKST.getFullYear()}-${String(todayKST.getMonth() + 1).padStart(2, '0')}-${String(todayKST.getDate()).padStart(2, '0')}`,
      stats,
      debug: debugInfo,
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Internal error',
      message: err instanceof Error ? err.message : String(err),
      stats,
    }, { status: 500 });
  }
}
