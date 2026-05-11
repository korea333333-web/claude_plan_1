import type { Category } from './anniversary';

export interface PresetItem {
  key: string;
  name: string;
  date_type: 'lunar' | 'solar';
  month: number;
  day: number;
  category: Category;
}

/** 기본 내장 명절 */
export const HOLIDAY_PRESETS: PresetItem[] = [
  { key: 'seollal', name: '설날', date_type: 'lunar', month: 1, day: 1, category: 'holiday' },
  { key: 'daeboreum', name: '정월대보름', date_type: 'lunar', month: 1, day: 15, category: 'holiday' },
  { key: 'hansik', name: '한식', date_type: 'solar', month: 4, day: 5, category: 'holiday' },
  { key: 'buddha', name: '부처님오신날', date_type: 'lunar', month: 4, day: 8, category: 'holiday' },
  { key: 'dano', name: '단오', date_type: 'lunar', month: 5, day: 5, category: 'holiday' },
  { key: 'chilseok', name: '칠석', date_type: 'lunar', month: 7, day: 7, category: 'holiday' },
  { key: 'chuseok', name: '추석', date_type: 'lunar', month: 8, day: 15, category: 'holiday' },
  { key: 'jungyangjeol', name: '중양절', date_type: 'lunar', month: 9, day: 9, category: 'holiday' },
];

/** 24절기 (양력 기준 근사 날짜) */
export const SOLAR_TERM_PRESETS: PresetItem[] = [
  // 봄
  { key: 'ipchun', name: '입춘', date_type: 'solar', month: 2, day: 4, category: 'holiday' },
  { key: 'usu', name: '우수', date_type: 'solar', month: 2, day: 19, category: 'holiday' },
  { key: 'gyeongchip', name: '경칩', date_type: 'solar', month: 3, day: 6, category: 'holiday' },
  { key: 'chunbun', name: '춘분', date_type: 'solar', month: 3, day: 21, category: 'holiday' },
  { key: 'cheongmyeong', name: '청명', date_type: 'solar', month: 4, day: 5, category: 'holiday' },
  { key: 'gogu', name: '곡우', date_type: 'solar', month: 4, day: 20, category: 'holiday' },
  // 여름
  { key: 'ipha', name: '입하', date_type: 'solar', month: 5, day: 6, category: 'holiday' },
  { key: 'soman', name: '소만', date_type: 'solar', month: 5, day: 21, category: 'holiday' },
  { key: 'mangjong', name: '망종', date_type: 'solar', month: 6, day: 6, category: 'holiday' },
  { key: 'haji', name: '하지', date_type: 'solar', month: 6, day: 21, category: 'holiday' },
  { key: 'soseo', name: '소서', date_type: 'solar', month: 7, day: 7, category: 'holiday' },
  { key: 'daeseo', name: '대서', date_type: 'solar', month: 7, day: 23, category: 'holiday' },
  // 가을
  { key: 'ipchu', name: '입추', date_type: 'solar', month: 8, day: 7, category: 'holiday' },
  { key: 'cheoseo', name: '처서', date_type: 'solar', month: 8, day: 23, category: 'holiday' },
  { key: 'baengno', name: '백로', date_type: 'solar', month: 9, day: 8, category: 'holiday' },
  { key: 'chubun', name: '추분', date_type: 'solar', month: 9, day: 23, category: 'holiday' },
  { key: 'hallo', name: '한로', date_type: 'solar', month: 10, day: 8, category: 'holiday' },
  { key: 'sanggang', name: '상강', date_type: 'solar', month: 10, day: 23, category: 'holiday' },
  // 겨울
  { key: 'ipdong', name: '입동', date_type: 'solar', month: 11, day: 7, category: 'holiday' },
  { key: 'soseol', name: '소설', date_type: 'solar', month: 11, day: 22, category: 'holiday' },
  { key: 'daeseol', name: '대설', date_type: 'solar', month: 12, day: 7, category: 'holiday' },
  { key: 'dongji', name: '동지', date_type: 'solar', month: 12, day: 22, category: 'holiday' },
  { key: 'sohan', name: '소한', date_type: 'solar', month: 1, day: 5, category: 'holiday' },
  { key: 'daehan', name: '대한', date_type: 'solar', month: 1, day: 20, category: 'holiday' },
];

/** 계절별 그룹 */
export const SOLAR_TERM_SEASONS = [
  { label: '봄', keys: ['ipchun', 'usu', 'gyeongchip', 'chunbun', 'cheongmyeong', 'gogu'] },
  { label: '여름', keys: ['ipha', 'soman', 'mangjong', 'haji', 'soseo', 'daeseo'] },
  { label: '가을', keys: ['ipchu', 'cheoseo', 'baengno', 'chubun', 'hallo', 'sanggang'] },
  { label: '겨울', keys: ['ipdong', 'soseol', 'daeseol', 'dongji', 'sohan', 'daehan'] },
];
