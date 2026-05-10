import type { AnniversaryWithDDay } from '@/lib/anniversary';
import { getLunarAsSolarForYear } from '@/lib/lunar';

interface Props {
  anniversary: AnniversaryWithDDay;
}

export default function AnniversaryCard({ anniversary }: Props) {
  const isLunar = anniversary.date_type === 'lunar';
  const ddayText = anniversary.dday === 0 ? 'D-Day' : `D-${anniversary.dday}`;

  const solarDate = anniversary.next_solar_date;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[solarDate.getDay()];

  let lunarDisplay = '';
  if (isLunar) {
    lunarDisplay = `음력 ${anniversary.month}월 ${anniversary.day}일`;
  }

  const solarDisplay = `${isLunar ? '양력 ' : ''}${solarDate.getMonth() + 1}월 ${solarDate.getDate()}일 (${weekday})`;

  return (
    <div className="relative bg-bg-card border border-border-card rounded-[20px] p-5 overflow-hidden">
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${
          isLunar ? 'bg-accent-lunar' : 'bg-accent-solar'
        }`}
      />

      <div className="flex justify-between items-start mb-2.5">
        <span
          className={`text-[10px] font-semibold tracking-[1.5px] uppercase px-2 py-0.5 rounded-md ${
            isLunar
              ? 'text-accent-lunar bg-accent-lunar-dim'
              : 'text-accent-solar bg-accent-solar-dim'
          }`}
        >
          {isLunar ? '음력' : '양력'}
        </span>
        <span
          className={`text-[22px] font-bold tracking-tight ${
            anniversary.dday === 0 ? 'text-accent-red' : 'text-accent-gold'
          }`}
        >
          {ddayText}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-1.5">{anniversary.name}</h3>

      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        {isLunar && (
          <>
            <span>{lunarDisplay}</span>
            <span className="text-text-tertiary text-[11px]">→</span>
          </>
        )}
        <span>{solarDisplay}</span>
      </div>

      {anniversary.count_label && (
        <div className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-gold-dim text-accent-gold">
          {anniversary.category === 'birthday' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
          )}
          {anniversary.count_label}
        </div>
      )}
    </div>
  );
}
