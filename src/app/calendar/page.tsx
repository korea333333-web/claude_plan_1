'use client';

import { useState, useMemo, useEffect } from 'react';
import { solarToLunar } from '@/lib/lunar';
import { enrichAnniversary, sortByDDay, groupByMonth, DEFAULT_ANNIVERSARIES } from '@/lib/anniversary';
import { createClient } from '@/lib/supabase';
import type { Anniversary, AnniversaryWithDDay } from '@/lib/anniversary';
import BottomNav from '@/components/BottomNav';

type ViewMode = 'thisMonth' | 'upcoming' | 'byMonth';

const viewLabels: { key: ViewMode; label: string }[] = [
  { key: 'thisMonth', label: '이번 달' },
  { key: 'upcoming', label: '다가오는 순서' },
  { key: 'byMonth', label: '월별' },
];

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPage() {
  const supabase = createClient();
  const [view, setView] = useState<ViewMode>('thisMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anniversaries, setAnniversaries] = useState<AnniversaryWithDDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('anniversaries')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data && data.length > 0) {
        const enriched = data.map((a: Anniversary) => enrichAnniversary(a));
        setAnniversaries(sortByDDay(enriched));
        setLoading(false);
        return;
      }
    }

    const demoData: Anniversary[] = DEFAULT_ANNIVERSARIES.map((d, i) => ({
      ...d,
      id: `demo-${i}`,
      user_id: 'demo',
      created_at: new Date().toISOString(),
    }));
    const enriched = demoData.map(a => enrichAnniversary(a));
    setAnniversaries(sortByDDay(enriched));
    setLoading(false);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells: { day: number; inMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, inMonth: true });
    }
    return cells;
  }, [year, month, firstDay, daysInMonth, prevMonthDays]);

  const monthEvents = useMemo(() => {
    return anniversaries.filter(a => {
      const nd = a.next_solar_date;
      return nd.getFullYear() === year && nd.getMonth() === month;
    }).sort((a, b) => a.next_solar_date.getDate() - b.next_solar_date.getDate());
  }, [anniversaries, year, month]);

  const eventDateSet = useMemo(() => {
    const map = new Map<number, AnniversaryWithDDay>();
    monthEvents.forEach(a => {
      map.set(a.next_solar_date.getDate(), a);
    });
    return map;
  }, [monthEvents]);

  const lunarRange = useMemo(() => {
    try {
      const first = solarToLunar(year, month + 1, 1);
      const last = solarToLunar(year, month + 1, daysInMonth);
      return `음력 ${first.month}월 ~ ${last.month}월`;
    } catch { return ''; }
  }, [year, month, daysInMonth]);

  const grouped = useMemo(() => groupByMonth(anniversaries), [anniversaries]);

  const isToday = (d: number) =>
    year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const titleText = view === 'thisMonth' ? '이번 달' : view === 'upcoming' ? '다가오는 순서' : '월별';
  const subtitleText = view === 'thisMonth'
    ? `${year}년 ${month + 1}월 · ${lunarRange}`
    : view === 'upcoming'
      ? `전체 ${anniversaries.length}건 · D-day 짧은 순서`
      : `달마다 그룹핑 · 올해 흐름`;
  const rightText = view === 'thisMonth'
    ? `${monthEvents.length}건`
    : view === 'byMonth'
      ? `${year}년`
      : '';

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg-deep flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-0">
        <div className="flex items-baseline justify-between pt-4 mb-1.5">
          <div className="flex items-baseline gap-2 relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-baseline gap-2"
            >
              <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none">{titleText}</h1>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 z-40 bg-[#1c1f27] border border-border-strong rounded-xl py-1.5 min-w-[180px] shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                  {viewLabels.map(v => (
                    <button
                      key={v.key}
                      onClick={() => { setView(v.key); setShowDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-[16px] ${
                        view === v.key
                          ? 'text-accent-gold font-bold'
                          : 'text-text-secondary'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {rightText && <span className="text-[14px] text-text-tertiary">{rightText}</span>}
        </div>
        <p className="text-[14px] text-text-tertiary mb-4">{subtitleText}</p>

        {/* Sub-nav tabs */}
        <div className="flex gap-4 border-b border-border-subtle">
          {viewLabels.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`text-[15px] pb-3 transition-all ${
                view === v.key
                  ? 'text-accent-gold font-bold border-b-[2px] border-accent-gold'
                  : 'text-text-tertiary'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {view === 'thisMonth' && (
        <ThisMonthView
          year={year}
          month={month}
          calendarDays={calendarDays}
          eventDateSet={eventDateSet}
          monthEvents={monthEvents}
          isToday={isToday}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
        />
      )}
      {view === 'upcoming' && <UpcomingView anniversaries={anniversaries} />}
      {view === 'byMonth' && <ByMonthView grouped={grouped} />}

      <BottomNav />
    </div>
  );
}


function ThisMonthView({
  year, month, calendarDays, eventDateSet, monthEvents, isToday, prevMonth, nextMonth,
}: {
  year: number;
  month: number;
  calendarDays: { day: number; inMonth: boolean }[];
  eventDateSet: Map<number, AnniversaryWithDDay>;
  monthEvents: AnniversaryWithDDay[];
  isToday: (d: number) => boolean;
  prevMonth: () => void;
  nextMonth: () => void;
}) {
  return (
    <>
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <button onClick={prevMonth} className="p-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-[16px] text-text-secondary font-medium">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="p-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Calendar grid with lunar dates */}
      <div className="px-3 pt-1 pb-2">
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map((wd, i) => (
            <div key={wd} className={`text-center text-[13px] py-1.5 font-medium ${i === 0 ? 'text-accent-red/70' : 'text-text-tertiary'}`}>
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, i) => {
            const isSunday = (i % 7) === 0;
            const event = cell.inMonth ? eventDateSet.get(cell.day) : undefined;
            const todayHighlight = cell.inMonth && isToday(cell.day);

            let lunarStr = '';
            if (cell.inMonth) {
              try {
                const lunar = solarToLunar(year, month + 1, cell.day);
                if (lunar.day === 1) {
                  lunarStr = `${lunar.month}월`;
                } else {
                  lunarStr = `${lunar.day}`;
                }
              } catch { /* skip */ }
            }

            return (
              <div key={i} className={`text-center py-2 relative flex flex-col items-center gap-0.5 ${
                todayHighlight ? 'bg-accent-gold-dim rounded-lg' : ''
              }`}>
                <span className={`text-[15px] font-medium leading-none ${
                  !cell.inMonth ? 'text-text-tertiary/20' :
                  todayHighlight ? 'text-accent-gold font-bold' :
                  event?.date_type === 'lunar' ? 'text-accent-gold font-bold' :
                  event?.date_type === 'solar' ? 'text-accent-solar font-bold' :
                  isSunday ? 'text-accent-red/70' : 'text-text-primary/80'
                }`}>
                  {cell.day}
                </span>
                <span className={`text-[10px] leading-none ${
                  !cell.inMonth ? 'text-text-tertiary/15' :
                  lunarStr.includes('월') ? 'text-accent-gold/70 font-semibold' :
                  'text-text-tertiary/60'
                }`}>
                  {cell.inMonth ? lunarStr : ''}
                </span>
                {event && cell.inMonth && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full ${
                    event.date_type === 'lunar' ? 'bg-accent-gold' : 'bg-accent-solar'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <div className="px-5 pt-3 border-t-[0.5px] border-border-subtle mt-2">
        {monthEvents.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-text-tertiary text-[16px]">이번 달 기념일이 없습니다</p>
          </div>
        ) : (
          monthEvents.map((ann) => {
            const nd = ann.next_solar_date;
            const wd = weekdays[nd.getDay()];
            const isLunar = ann.date_type === 'lunar';
            const isClose = ann.dday <= 14;

            return (
              <div key={ann.id} className="flex gap-3 py-3.5 border-b-[0.5px] border-border-subtle last:border-b-0 items-center">
                <div className="text-center shrink-0 w-[40px]">
                  <div className="text-[13px] text-text-tertiary leading-none mb-1">{wd}</div>
                  <div className={`text-[28px] font-bold tracking-[-1px] leading-none ${
                    isLunar ? 'text-accent-gold' : 'text-accent-solar'
                  }`}>
                    {nd.getDate()}
                  </div>
                </div>
                <div className={`w-[3px] self-stretch rounded-sm shrink-0 ${
                  isLunar ? 'bg-accent-gold' : 'bg-accent-solar'
                }`} style={{ minHeight: '40px' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] font-semibold">{ann.name}</span>
                    {ann.count_label && (
                      <span className={`text-[14px] font-bold ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>
                        {ann.count_label}
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-text-tertiary mt-0.5">
                    {isLunar ? (
                      <span className="text-accent-gold font-semibold">음 {ann.month}.{ann.day}</span>
                    ) : (
                      <span className="text-accent-solar font-semibold">양 {nd.getMonth() + 1}.{nd.getDate()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-[2px] shrink-0">
                  <span className={`text-[13px] ${isClose ? 'text-accent-gold-soft' : 'text-text-tertiary/50'}`}>D—</span>
                  <span className={`text-[24px] font-bold tracking-[-0.5px] leading-none ${
                    isClose ? 'text-accent-gold' : 'text-text-secondary/80'
                  }`}>
                    {ann.dday}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}


function UpcomingView({ anniversaries }: { anniversaries: AnniversaryWithDDay[] }) {
  return (
    <div className="px-5 pt-2">
      {anniversaries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary text-[16px]">등록된 기념일이 없습니다</p>
        </div>
      ) : (
        anniversaries.map((ann) => {
          const nd = ann.next_solar_date;
          const wd = weekdays[nd.getDay()];
          const isLunar = ann.date_type === 'lunar';
          const isClose = ann.dday <= 14;

          return (
            <div key={ann.id} className="flex gap-3 py-3 border-b-[0.5px] border-border-subtle last:border-b-0 items-center">
              <div className={`w-[3px] rounded-sm shrink-0 ${
                isLunar ? 'bg-accent-gold' : 'bg-accent-solar'
              }`} style={{ height: '36px' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[16px] font-semibold">{ann.name}</span>
                  {ann.count_label && (
                    <span className={`text-[14px] font-bold ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>
                      {ann.count_label}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-text-tertiary mt-0.5">
                  {isLunar ? (
                    <>
                      <span className="text-accent-gold font-semibold">음 {ann.month}.{ann.day}</span>
                      <span> → {nd.getMonth() + 1}.{nd.getDate()} {wd}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-accent-solar font-semibold">양 {nd.getMonth() + 1}.{nd.getDate()}</span>
                      <span> {wd}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-[2px] shrink-0">
                <span className={`text-[13px] ${isClose ? 'text-accent-gold-soft' : 'text-text-tertiary/50'}`}>D—</span>
                <span className={`text-[24px] font-bold tracking-[-0.5px] leading-none ${
                  isClose ? 'text-accent-gold' : 'text-text-secondary/80'
                }`}>
                  {ann.dday}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


function ByMonthView({ grouped }: { grouped: Map<string, AnniversaryWithDDay[]> }) {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;

  return (
    <div className="px-5 pt-2">
      {grouped.size === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary text-[16px]">등록된 기념일이 없습니다</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([monthLabel, events], groupIdx) => {
          const isCurrentMonth = monthLabel === currentMonthKey;
          const monthNum = monthLabel.replace(/[^0-9]/g, ' ').trim().split(/\s+/).pop();

          return (
            <div key={monthLabel}>
              {/* Month header */}
              <div className={`flex justify-between items-baseline ${groupIdx > 0 ? 'border-t-[0.5px] border-border-subtle/50 pt-4' : 'pt-3'} pb-2`}>
                <div className="flex items-baseline gap-2">
                  <span className={`text-[20px] font-extrabold tracking-[-0.5px] ${
                    isCurrentMonth ? 'text-accent-gold' : 'text-text-primary/85'
                  }`}>
                    {monthNum}월
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[13px] text-text-tertiary">이번 달</span>
                  )}
                </div>
                <span className="text-[13px] text-text-tertiary">{events.length}건</span>
              </div>

              {/* Events in this month */}
              {events
                .sort((a, b) => a.next_solar_date.getDate() - b.next_solar_date.getDate())
                .map((ann, i) => {
                  const nd = ann.next_solar_date;
                  const isLunar = ann.date_type === 'lunar';
                  const isClose = ann.dday <= 14;

                  return (
                    <div key={ann.id} className={`flex gap-3 py-2.5 items-center ${
                      i < events.length - 1 ? 'border-b-[0.5px] border-border-subtle/30' : ''
                    }`}>
                      <div className="text-[14px] text-text-tertiary w-6 shrink-0 text-center font-medium">
                        {nd.getDate()}
                      </div>
                      <div className={`w-[3px] rounded-sm shrink-0 ${
                        isLunar ? 'bg-accent-gold' : 'bg-accent-solar'
                      }`} style={{ height: '26px' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-semibold">{ann.name}</span>
                        {ann.count_label && (
                          <span className={`text-[13px] font-bold ml-2 ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>
                            {ann.count_label}
                          </span>
                        )}
                      </div>
                      <span className={`text-[16px] font-bold shrink-0 ${
                        isClose ? 'text-accent-gold' : 'text-text-secondary/80'
                      }`}>
                        D-{ann.dday}
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })
      )}
    </div>
  );
}
