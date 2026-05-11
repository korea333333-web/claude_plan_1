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

  const lunarRange = (() => {
    try {
      const first = solarToLunar(year, month + 1, 1);
      const last = solarToLunar(year, month + 1, daysInMonth);
      return `음력 ${first.month}월 ~ ${last.month}월`;
    } catch { return ''; }
  })();

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-4">
        <div className="flex items-baseline justify-between pt-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none">{month + 1}월</h1>
            <button onClick={prevMonth} className="text-text-secondary ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={nextMonth} className="text-text-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <span className="text-[12px] text-text-secondary">{monthEvents.length}건</span>
        </div>
        <p className="text-[11px] text-text-secondary mt-1.5">{year}년 {month + 1}월 · {lunarRange}</p>
      </div>

      {/* Calendar */}
      <div className="px-6 pt-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1.5">
          {weekdays.map((wd, i) => (
            <div key={wd} className={`text-center text-[9px] ${i === 0 ? 'text-accent-red' : 'text-text-tertiary'}`}>
              {wd}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-[2px]">
          {days.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} className="py-[5px]" />;
            const event = hasEvent(d);
            const isSunday = (i % 7) === 0;
            const isTodayD = isToday(d);

            return (
              <div key={d} className={`text-center py-[5px] relative ${isTodayD ? 'bg-accent-gold-dim rounded-md' : ''}`}>
                <span className={`text-[11px] font-medium ${
                  isTodayD ? 'text-accent-gold font-bold' :
                  event?.date_type === 'lunar' ? 'text-accent-gold font-bold' :
                  event?.date_type === 'solar' ? 'text-accent-solar font-bold' :
                  isSunday ? 'text-accent-red' : 'text-text-secondary'
                }`}>
                  {d}
                </span>
                {event && (
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    event.date_type === 'lunar' ? 'bg-accent-gold' : 'bg-accent-solar'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Month events */}
      {monthEvents.length > 0 && (
        <div className="px-6 pt-4 mt-2.5 border-t border-border-subtle">
          {monthEvents.map((ann) => {
            const nd = ann.next_solar_date;
            const wd = weekdays[nd.getDay()];
            const isLunar = ann.date_type === 'lunar';
            return (
              <div key={ann.id} className="flex gap-3 py-3.5 border-b border-border-subtle items-center">
                <div className={`text-center shrink-0 px-1.5 ${isLunar ? '' : ''}`}>
                  <div className="text-[10px] text-text-secondary">{wd}</div>
                  <div className={`text-[24px] font-bold tracking-[-1px] leading-none ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>
                    {nd.getDate()}
                  </div>
                </div>
                <div className={`w-[2.5px] self-stretch rounded-sm ${isLunar ? 'bg-accent-gold' : 'bg-accent-solar'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold">{ann.name}</span>
                    {ann.count_label && (
                      <span className={`text-[12px] font-bold ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>{ann.count_label}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    {isLunar && <><span className="font-semibold text-accent-gold">음 {ann.month}.{ann.day}</span></>}
                  </div>
                </div>
                <div className={`flex items-baseline gap-[2px] ${ann.dday <= 14 ? '' : 'opacity-50'}`}>
                  <span className={`text-[11px] font-medium ${ann.dday <= 14 ? 'text-accent-gold-soft' : 'text-text-tertiary'}`}>D—</span>
                  <span className={`text-[22px] font-bold tracking-[-1px] leading-none ${ann.dday <= 14 ? 'text-accent-gold' : 'text-text-secondary'}`}>
                    {ann.dday}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
