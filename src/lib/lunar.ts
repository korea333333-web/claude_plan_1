import KoreanLunarCalendar from 'korean-lunar-calendar';

const calendar = new KoreanLunarCalendar();

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth = false): SolarDate {
  calendar.setLunarDate(lunarYear, lunarMonth, lunarDay, isLeapMonth);
  const sol = calendar.getSolarCalendar();
  return { year: sol.year, month: sol.month, day: sol.day };
}

export function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): LunarDate {
  calendar.setSolarDate(solarYear, solarMonth, solarDay);
  const lun = calendar.getLunarCalendar();
  return {
    year: lun.year,
    month: lun.month,
    day: lun.day,
    isLeapMonth: lun.intercalation ?? false,
  };
}

export function getLunarAsSolarForYear(lunarMonth: number, lunarDay: number, targetYear: number, isLeapMonth = false): SolarDate {
  return lunarToSolar(targetYear, lunarMonth, lunarDay, isLeapMonth);
}

export function formatSolarDate(date: SolarDate): string {
  const d = new Date(date.year, date.month - 1, date.day);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${date.year}년 ${date.month}월 ${date.day}일 (${weekday})`;
}

export function formatLunarDate(date: LunarDate): string {
  return `음력 ${date.month}월 ${date.day}일${date.isLeapMonth ? ' (윤달)' : ''}`;
}

export function solarDateToDate(solar: SolarDate): Date {
  return new Date(solar.year, solar.month - 1, solar.day);
}
