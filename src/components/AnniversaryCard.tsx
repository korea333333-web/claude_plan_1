'use client';

import type { AnniversaryWithDDay } from '@/lib/anniversary';
import { useRouter } from 'next/navigation';

const CATEGORY_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  birthday: { label: '생일', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  memorial: { label: '제사', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  anniversary: { label: '기념일', color: 'text-accent-gold', bg: 'bg-accent-gold-dim' },
  holiday: { label: '명절', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  other: { label: '기타', color: 'text-text-tertiary', bg: 'bg-bg-input' },
};

interface Props {
  anniversary: AnniversaryWithDDay;
}

export default function AnniversaryCard({ anniversary }: Props) {
  const router = useRouter();
  const isLunar = anniversary.date_type === 'lunar';
  const style = CATEGORY_STYLE[anniversary.category] || CATEGORY_STYLE.other;
  const solarDate = anniversary.next_solar_date;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[solarDate.getDay()];
  const isDemo = anniversary.id.startsWith('demo-');

  const ddayText = anniversary.dday === 0 ? 'D-Day' : `D-${anniversary.dday}`;
  const ddayColor = anniversary.dday === 0
    ? 'text-accent-red'
    : anniversary.dday <= 7
      ? 'text-accent-gold'
      : 'text-accent-gold/60';

  return (
    <div
      onClick={() => !isDemo && router.push(`/edit/${anniversary.id}`)}
      className={`relative bg-bg-card border border-border-card rounded-[20px] p-5 overflow-hidden
        transition-transform duration-150 active:scale-[0.97]
        ${!isDemo ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isLunar ? 'bg-accent-lunar' : 'bg-accent-solar'}`} />

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold tracking-[0.5px] px-2 py-0.5 rounded-md ${
            isLunar ? 'text-accent-lunar bg-accent-lunar-dim' : 'text-accent-solar bg-accent-solar-dim'
          }`}>
            {isLunar ? '음력' : '양력'}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${style.color} ${style.bg}`}>
            {style.label}
          </span>
        </div>
        <span className={`text-xl font-bold tracking-tight shrink-0 ml-2 ${ddayColor}`}>
          {ddayText}
        </span>
      </div>

      <h3 className="text-[17px] font-semibold mb-1">
        {anniversary.name}
      </h3>

      <p className="text-[13px] text-text-secondary">
        {isLunar && <>{`음력 ${anniversary.month}/${anniversary.day}`} <span className="text-text-tertiary mx-0.5">→</span> </>}
        {`양력 ${solarDate.getMonth() + 1}/${solarDate.getDate()} (${weekday})`}
      </p>

      {anniversary.count_label && (
        <div className="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-gold-dim text-accent-gold">
          {anniversary.count_label}
        </div>
      )}
    </div>
  );
}
