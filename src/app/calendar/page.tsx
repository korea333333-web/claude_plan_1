'use client';

import { useState, useMemo } from 'react';
import { solarToLunar } from '@/lib/lunar';
import { enrichAnniversary, DEFAULT_ANNIVERSARIES } from '@/lib/anniversary';
import type { Anniversary, AnniversaryWithDDay } from '@/lib/anniversary';
import BottomNav from '@/components/BottomNav';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const demoAnniversaries: AnniversaryWithDDay[] = useMemo(() => {
    const data: Anniversary[] = DEFAULT_ANNIVERSARIES.map((d, i) => ({
      ...d,
      id: `demo-${i}`,
      user_id: 'demo',
      created_at: new Date().toISOString(),
    }));
    return data.map(a => enrichAnniversary(a));
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function getLunarForDay(d: number): string {
    try {
      const lunar = solarToLunar(year, month + 1, d);
      return `${lunar.month}/${lunar.day}`;
    } catch {
      return '';
    }
  }

  function hasEvent(d: number): AnniversaryWithDDay | undefined {
    return demoAnniversaries.find(a => {
      const nd = a.next_solar_date;
      return nd.getFullYear() === year && nd.getMonth() === month && nd.getDate() === d;
    });
  }

  function isToday(d: number): boolean {
    return year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthEvents = demoAnniversaries.filter(a => {
    const nd = a.next_solar_date;
    return nd.getFullYear() === year && nd.getMonth() === month;
  });

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="flex items-center justify-center gap-5 px-6 pt-[env(safe-area-inset-top,16px)] pb-6">
        <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-bg-card border border-border-card flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-lg font-semibold pt-4">{year}년 {month + 1}월</h1>
        <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-bg-card border border-border-card flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-4 mb-2">
        {weekdays.map((wd, i) => (
          <div key={wd} className={`text-center text-[11px] font-medium py-2 ${i === 0 ? 'text-accent-red' : 'text-text-tertiary'}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-4 gap-0.5">
        {days.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} className="aspect-square" />;
          const event = hasEvent(d);
          const isSunday = (i % 7) === 0;
          const todayClass = isToday(d);
          const lunarStr = getLunarForDay(d);

          return (
            <div
              key={d}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl relative cursor-pointer gap-0.5 ${
                todayClass ? 'bg-accent-gold-dim' : 'hover:bg-bg-card'
              }`}
            >
              <span className={`text-[15px] font-medium ${
                todayClass ? 'text-accent-gold font-bold' : isSunday ? 'text-accent-red' : 'text-text-primary'
              }`}>
                {d}
              </span>
              <span className="text-[9px] text-text-tertiary">{lunarStr}</span>
              {event && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent-gold" />
              )}
            </div>
          );
        })}
      </div>

      {/* Events this month */}
      {monthEvents.length > 0 && (
        <div className="px-5 pt-6 pb-4">
          <h2 className="text-xs font-semibold tracking-[1.5px] uppercase text-text-tertiary px-1 mb-3.5">
            이번 달 기념일
          </h2>
          <div className="space-y-2">
            {monthEvents.map((ann) => (
              <div key={ann.id} className="flex items-center gap-3.5 px-4 py-4 bg-bg-card border border-border-card rounded-[14px]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ann.date_type === 'lunar' ? 'bg-accent-lunar' : 'bg-accent-solar'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ann.name}</div>
                  <div className="text-xs text-text-tertiary">
                    {ann.next_solar_date.getMonth() + 1}/{ann.next_solar_date.getDate()} ({weekdays[ann.next_solar_date.getDay()]})
                    {ann.date_type === 'lunar' && ` · 음력 ${ann.month}/${ann.day}`}
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent-gold flex-shrink-0">
                  {ann.dday === 0 ? 'D-Day' : `D-${ann.dday}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
