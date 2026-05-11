'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Category, RepeatType } from '@/lib/anniversary';
import BottomNav from '@/components/BottomNav';
import DatePickerSheet from '@/components/DatePickerSheet';

const categories: { value: Category; label: string }[] = [
  { value: 'birthday', label: '생일' },
  { value: 'memorial', label: '제사' },
  { value: 'anniversary', label: '기념일' },
  { value: 'holiday', label: '명절' },
  { value: 'other', label: '기타' },
];

const repeatTypes: { value: RepeatType; label: string }[] = [
  { value: 'yearly', label: '매년' },
  { value: 'once', label: '일회성' },
];

export default function AddPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [dateType, setDateType] = useState<'lunar' | 'solar'>('lunar');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [category, setCategory] = useState<Category>('birthday');
  const [repeatType, setRepeatType] = useState<RepeatType>('yearly');
  const [startYear, setStartYear] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [alarms, setAlarms] = useState([
    { enabled: true, daysBefore: 7, hour: 9, minute: 0 },
    { enabled: true, daysBefore: 3, hour: 9, minute: 0 },
    { enabled: true, daysBefore: 0, hour: 9, minute: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const dayOptions = [0, 1, 2, 3, 5, 7, 14, 30];

  async function handleSave() {
    if (!name) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('anniversaries').insert({
      user_id: user.id,
      name,
      date_type: dateType,
      month,
      day,
      category,
      repeat_type: repeatType,
      start_year: startYear ? parseInt(startYear) : null,
      is_shared: isShared,
      is_leap_month: false,
      alarms,
    });

    if (error) {
      console.error('Save failed:', error);
      alert(`저장 실패: ${error.message}\ncode: ${error.code}`);
    } else {
      router.push('/');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-[env(safe-area-inset-top,16px)] pb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-bg-card-strong border border-border-card flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none pt-4">추가</h1>
      </div>

      <div className="px-6 space-y-7">
        {/* Name */}
        <FormField label="기념일 이름">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 어머니 생신"
            className="w-full px-4 py-3.5 bg-bg-card-strong border border-border-strong rounded-xl text-[17px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
          />
        </FormField>

        {/* Date Type */}
        <FormField label="날짜 기준">
          <div className="flex bg-bg-card border border-border-strong rounded-full p-1">
            {(['lunar', 'solar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setDateType(type)}
                className={`flex-1 py-3 rounded-full text-[15px] font-medium text-center transition-all ${
                  dateType === type
                    ? 'bg-accent-gold text-bg-deep font-bold'
                    : 'text-text-secondary'
                }`}
              >
                {type === 'lunar' ? '음력' : '양력'}
              </button>
            ))}
          </div>
        </FormField>

        {/* Date */}
        <FormField label="날짜">
          <DatePickerSheet month={month} day={day} onConfirm={(m, d) => { setMonth(m); setDay(d); }} />
        </FormField>

        {/* Category */}
        <FormField label="카테고리">
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2.5 rounded-full text-[15px] font-medium border-[0.5px] transition-all ${
                  category === cat.value
                    ? 'bg-accent-gold-dim border-accent-gold text-accent-gold font-semibold'
                    : 'bg-bg-card border-border-strong text-text-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Repeat */}
        <FormField label="반복">
          <div className="flex bg-bg-card border border-border-strong rounded-full p-1">
            {repeatTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setRepeatType(rt.value)}
                className={`flex-1 py-3 rounded-full text-[15px] font-medium text-center transition-all ${
                  repeatType === rt.value
                    ? 'bg-accent-gold text-bg-deep font-bold'
                    : 'text-text-secondary'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Start Year */}
        <FormField label="시작 연도 (태어난 해)">
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="예: 1957 (선택사항)"
            className="w-full px-4 py-3.5 bg-bg-card-strong border border-border-strong rounded-xl text-[17px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
          />
        </FormField>

        {/* Alarms */}
        <FormField label="알림">
          <div className="space-y-2.5">
            {alarms.map((alarm, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-bg-card-strong border border-border-strong rounded-xl">
                <span className="text-[13px] text-accent-gold-soft font-bold w-6 shrink-0">{i + 1}차</span>
                <select
                  value={alarm.daysBefore}
                  onChange={(e) => {
                    const next = [...alarms];
                    next[i] = { ...next[i], daysBefore: parseInt(e.target.value) };
                    setAlarms(next);
                  }}
                  disabled={!alarm.enabled}
                  className="flex-1 bg-bg-card border border-border-strong rounded-lg px-3 py-2.5 text-[15px] text-text-primary outline-none disabled:opacity-40"
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>{d === 0 ? '당일' : `${d}일 전`}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={`${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const next = [...alarms];
                    next[i] = { ...next[i], hour: h || 0, minute: m || 0 };
                    setAlarms(next);
                  }}
                  disabled={!alarm.enabled}
                  className="w-[96px] bg-bg-card border border-border-strong rounded-lg px-3 py-2.5 text-[15px] text-text-primary outline-none disabled:opacity-40"
                />
                <button
                  onClick={() => {
                    const next = [...alarms];
                    next[i] = { ...next[i], enabled: !next[i].enabled };
                    setAlarms(next);
                  }}
                  className={`w-11 h-[26px] rounded-full relative transition-colors shrink-0 ${
                    alarm.enabled ? 'bg-accent-gold' : 'bg-text-tertiary'
                  }`}
                >
                  <div className={`w-[20px] h-[20px] rounded-full bg-white absolute top-[3px] transition-transform ${
                    alarm.enabled ? 'translate-x-[21px]' : 'translate-x-[3px]'
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-text-tertiary mt-2.5 text-center">기본 오전 9시 · 날짜와 시간 변경 가능</p>
        </FormField>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!name || saving}
          className="w-full py-4 rounded-full bg-accent-gold text-bg-deep text-[17px] font-bold disabled:opacity-40 transition-opacity mt-4 mb-8"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-bold tracking-[1.5px] uppercase text-accent-gold mb-3">{label}</label>
      {children}
    </div>
  );
}
