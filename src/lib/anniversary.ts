import { getLunarAsSolarForYear, solarDateToDate } from './lunar';

export type DateType = 'lunar' | 'solar';
export type Category = 'birthday' | 'memorial' | 'anniversary' | 'holiday' | 'other';
export type RepeatType = 'yearly' | 'monthly' | 'once';

export interface AlarmConfig {
  enabled: boolean;
  daysBefore: number;
  hour: number;
  minute: number;
}

export interface Anniversary {
  id: string;
  user_id: string;
  name: string;
  date_type: DateType;
  month: number;
  day: number;
  category: Category;
  repeat_type: RepeatType;
  start_year: number | null;
  is_shared: boolean;
  is_leap_month: boolean;
  created_at: string;
  alarms?: AlarmConfig[];
}

export interface AnniversaryWithDDay extends Anniversary {
  next_solar_date: Date;
  dday: number;
  count: number | null;
  count_label: string | null;
}

export function getNextOccurrence(anniversary: Anniversary, baseDate: Date = new Date()): Date {
  const currentYear = baseDate.getFullYear();
  const today = new Date(currentYear, baseDate.getMonth(), baseDate.getDate());

  if (anniversary.repeat_type === 'monthly') {
    const thisMonth = new Date(currentYear, baseDate.getMonth(), anniversary.day);
    if (thisMonth >= today) return thisMonth;
    const nextMonth = new Date(currentYear, baseDate.getMonth() + 1, anniversary.day);
    return nextMonth;
  }

  let targetYear = currentYear;

  for (let attempt = 0; attempt < 3; attempt++) {
    let solarDate: Date;

    if (anniversary.date_type === 'lunar') {
      const solar = getLunarAsSolarForYear(anniversary.month, anniversary.day, targetYear, anniversary.is_leap_month);
      solarDate = solarDateToDate(solar);
    } else {
      solarDate = new Date(targetYear, anniversary.month - 1, anniversary.day);
    }

    if (solarDate >= today) return solarDate;
    targetYear++;
  }

  return new Date(currentYear + 1, anniversary.month - 1, anniversary.day);
}

export function calculateDDay(targetDate: Date, baseDate: Date = new Date()): number {
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateCount(anniversary: Anniversary, targetDate: Date): { count: number; label: string } | null {
  if (!anniversary.start_year) return null;

  const targetYear = targetDate.getFullYear();

  if (anniversary.category === 'birthday') {
    const koreanAge = targetYear - anniversary.start_year + 1;
    const specialBirthdays: Record<number, string> = {
      60: '환갑',
      61: '환갑',
      70: '칠순',
      77: '희수',
      80: '팔순',
      88: '미수',
      90: '졸수',
      99: '백수',
      100: '상수',
    };
    const special = specialBirthdays[koreanAge];
    const label = special ? `${koreanAge}세 · ${special}` : `${koreanAge}세`;
    return { count: koreanAge, label };
  }

  const years = targetYear - anniversary.start_year;
  if (years <= 0) return null;
  return { count: years, label: `${years}주년` };
}

export function enrichAnniversary(anniversary: Anniversary, baseDate: Date = new Date()): AnniversaryWithDDay {
  const nextDate = getNextOccurrence(anniversary, baseDate);
  const dday = calculateDDay(nextDate, baseDate);
  const countInfo = calculateCount(anniversary, nextDate);

  return {
    ...anniversary,
    next_solar_date: nextDate,
    dday,
    count: countInfo?.count ?? null,
    count_label: countInfo?.label ?? null,
  };
}

export function sortByDDay(anniversaries: AnniversaryWithDDay[]): AnniversaryWithDDay[] {
  return [...anniversaries].sort((a, b) => a.dday - b.dday);
}

export function groupByMonth(anniversaries: AnniversaryWithDDay[]): Map<string, AnniversaryWithDDay[]> {
  const groups = new Map<string, AnniversaryWithDDay[]>();
  for (const ann of anniversaries) {
    const key = `${ann.next_solar_date.getFullYear()}년 ${ann.next_solar_date.getMonth() + 1}월`;
    const group = groups.get(key) ?? [];
    group.push(ann);
    groups.set(key, group);
  }
  return groups;
}

export const DEFAULT_ANNIVERSARIES: Omit<Anniversary, 'id' | 'user_id' | 'created_at'>[] = [
  {
    name: '어머니 생신',
    date_type: 'lunar',
    month: 3,
    day: 15,
    category: 'birthday',
    repeat_type: 'yearly',
    start_year: 1960,
    is_shared: false,
    is_leap_month: false,
  },
  {
    name: '결혼기념일',
    date_type: 'solar',
    month: 6,
    day: 15,
    category: 'anniversary',
    repeat_type: 'yearly',
    start_year: 2016,
    is_shared: false,
    is_leap_month: false,
  },
  {
    name: '석가탄신일',
    date_type: 'lunar',
    month: 4,
    day: 8,
    category: 'holiday',
    repeat_type: 'yearly',
    start_year: null,
    is_shared: false,
    is_leap_month: false,
  },
  {
    name: '할아버지 제사',
    date_type: 'lunar',
    month: 7,
    day: 3,
    category: 'memorial',
    repeat_type: 'yearly',
    start_year: null,
    is_shared: false,
    is_leap_month: false,
  },
  {
    name: '추석',
    date_type: 'lunar',
    month: 8,
    day: 15,
    category: 'holiday',
    repeat_type: 'yearly',
    start_year: null,
    is_shared: false,
    is_leap_month: false,
  },
  {
    name: '설날',
    date_type: 'lunar',
    month: 1,
    day: 1,
    category: 'holiday',
    repeat_type: 'yearly',
    start_year: null,
    is_shared: false,
    is_leap_month: false,
  },
];
