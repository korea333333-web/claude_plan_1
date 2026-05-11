'use client';

import type { AnniversaryWithDDay } from '@/lib/anniversary';
import { useRouter } from 'next/navigation';

const CATEGORY_LABEL: Record<string, string> = {
  birthday: '생일',
  memorial: '제사',
  anniversary: '기념일',
  holiday: '명절',
  other: '기타',
};

interface Props {
  anniversary: AnniversaryWithDDay;
}

export default function AnniversaryCard({ anniversary }: Props) {
  const router = useRouter();
  const isLunar = anniversary.date_type === 'lunar';
  const label = CATEGORY_LABEL[anniversary.category] || '기타';
  const solarDate = anniversary.next_solar_date;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[solarDate.getDay()];
  const isDemo = anniversary.id.startsWith('demo-');

  const ddayNum = anniversary.dday;
  const isActive = ddayNum <= 14;

  return (
    <div
      onClick={() => !isDemo && router.push(`/edit/${anniversary.id}`)}
      className={`flex gap-3 py-4 border-b border-border-subtle items-start
        transition-opacity duration-150 active:opacity-70
        ${!isDemo ? 'cursor-pointer' : ''}`}
    >
      {/* Left color bar */}
      <div className={`w-[3px] self-stretch rounded-sm shrink-0 ${isLunar ? 'bg-accent-gold' : 'bg-accent-solar'}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[13px] font-semibold tracking-[0.5px] px-2 py-[2px] rounded-sm border-[0.5px] ${
            isLunar
              ? 'text-accent-gold border-accent-gold-dim'
              : 'text-accent-solar border-accent-solar-dim'
          }`}>
            {label}
          </span>
          {anniversary.is_shared && (
            <span className="text-[13px] text-text-secondary font-medium">가족</span>
          )}
        </div>

        {/* Name + count */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[18px] font-semibold tracking-[-0.3px]">{anniversary.name}</span>
          {anniversary.count_label && (
            <span className={`text-[15px] font-bold ${isLunar ? 'text-accent-gold' : 'text-accent-solar'}`}>
              {anniversary.count_label}
            </span>
          )}
        </div>

        {/* Date */}
        <p className="text-[15px] text-text-secondary">
          {isLunar ? (
            <>
              <span className="font-semibold text-accent-gold">음 {anniversary.month}.{anniversary.day}</span>
              {' → '}
              {solarDate.getMonth() + 1}월 {solarDate.getDate()}일 {weekday}요일
            </>
          ) : (
            <>
              <span className="font-semibold text-accent-solar">양 {solarDate.getMonth() + 1}.{solarDate.getDate()}</span>
              {' '}
              {weekday}요일
            </>
          )}
        </p>
      </div>

      {/* D-day */}
      <div className={`flex items-baseline gap-[2px] pt-5 shrink-0 ${isActive ? '' : 'opacity-50'}`}>
        <span className={`text-[14px] font-medium ${isActive ? 'text-accent-gold-soft' : 'text-text-tertiary'}`}>D—</span>
        <span className={`text-[28px] font-bold tracking-[-1px] leading-none ${isActive ? 'text-accent-gold' : 'text-text-secondary'}`}>
          {ddayNum === 0 ? 'Day' : ddayNum}
        </span>
      </div>
    </div>
  );
}
