'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Category, RepeatType } from '@/lib/anniversary';
import BottomNav from '@/components/BottomNav';

const categories: { value: Category; label: string }[] = [
  { value: 'birthday', label: '생일' },
  { value: 'memorial', label: '제사' },
  { value: 'anniversary', label: '기념일' },
  { value: 'other', label: '기타' },
];

const repeatTypes: { value: RepeatType; label: string }[] = [
  { value: 'yearly', label: '매년' },
  { value: 'monthly', label: '매달' },
  { value: 'once', label: '일회성' },
];

export default function AddPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [dateType, setDateType] = useState<'lunar' | 'solar'>('lunar');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [category, setCategory] = useState<Category>('birthday');
  const [repeatType, setRepeatType] = useState<RepeatType>('yearly');
  const [startYear, setStartYear] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [alarms, setAlarms] = useState([true, true, true]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name || !month || !day) return;
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
      month: parseInt(month),
      day: parseInt(day),
      category,
      repeat_type: repeatType,
      start_year: startYear ? parseInt(startYear) : null,
      is_shared: isShared,
      is_leap_month: false,
    });

    if (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다');
    } else {
      router.push('/');
    }
    setSaving(false);
  }

  const alarmLabels = ['7일 전', '3일 전', '당일'];

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top,16px)] pb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-bg-card border border-border-card flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold pt-4">기념일 추가</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">기념일 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 어머니 생신"
            className="w-full px-4 py-4 bg-bg-input border border-border-card rounded-[14px] text-[15px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
          />
        </div>

        {/* Date Type */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">날짜 기준</label>
          <div className="flex bg-bg-input border border-border-card rounded-[14px] p-1">
            {(['lunar', 'solar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setDateType(type)}
                className={`flex-1 py-3 rounded-[10px] text-sm font-medium text-center transition-all ${
                  dateType === type
                    ? type === 'lunar'
                      ? 'bg-accent-lunar-dim text-accent-lunar font-semibold'
                      : 'bg-accent-solar-dim text-accent-solar font-semibold'
                    : 'text-text-tertiary'
                }`}
              >
                {type === 'lunar' ? '음력' : '양력'}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">날짜</label>
          <div className="flex gap-2.5">
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="월"
              min="1"
              max="12"
              className="flex-1 px-4 py-4 bg-bg-input border border-border-card rounded-[14px] text-[15px] text-text-primary text-center placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
            />
            <input
              type="number"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="일"
              min="1"
              max="31"
              className="flex-1 px-4 py-4 bg-bg-input border border-border-card rounded-[14px] text-[15px] text-text-primary text-center placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                  category === cat.value
                    ? 'bg-accent-gold-dim border-accent-gold/30 text-accent-gold'
                    : 'bg-bg-input border-border-card text-text-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">반복</label>
          <div className="flex bg-bg-input border border-border-card rounded-[14px] p-1">
            {repeatTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setRepeatType(rt.value)}
                className={`flex-1 py-3 rounded-[10px] text-sm font-medium text-center transition-all ${
                  repeatType === rt.value
                    ? 'bg-accent-gold-dim text-accent-gold font-semibold'
                    : 'text-text-tertiary'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Year */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">시작 연도 (태어난 해)</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="예: 1957 (선택사항)"
            className="w-full px-4 py-4 bg-bg-input border border-border-card rounded-[14px] text-[15px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-gold transition-colors"
          />
        </div>

        {/* Alarms */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">알림</label>
          <div className="space-y-2">
            {alarmLabels.map((label, i) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5 bg-bg-input border border-border-card rounded-[14px]">
                <span className="text-sm text-text-secondary">{label}</span>
                <button
                  onClick={() => {
                    const next = [...alarms];
                    next[i] = !next[i];
                    setAlarms(next);
                  }}
                  className={`w-11 h-[26px] rounded-full relative transition-colors ${
                    alarms[i] ? 'bg-accent-gold' : 'bg-text-tertiary'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-[3px] transition-transform ${
                      alarms[i] ? 'translate-x-[21px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <div>
          <label className="block text-xs font-semibold tracking-[1px] uppercase text-text-tertiary mb-2.5">공유 범위</label>
          <div className="flex bg-bg-input border border-border-card rounded-[14px] p-1">
            <button
              onClick={() => setIsShared(false)}
              className={`flex-1 py-3 rounded-[10px] text-sm font-medium text-center transition-all ${
                !isShared ? 'bg-accent-gold-dim text-accent-gold font-semibold' : 'text-text-tertiary'
              }`}
            >
              개인
            </button>
            <button
              onClick={() => setIsShared(true)}
              className={`flex-1 py-3 rounded-[10px] text-sm font-medium text-center transition-all ${
                isShared ? 'bg-accent-gold-dim text-accent-gold font-semibold' : 'text-text-tertiary'
              }`}
            >
              가족 공유
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!name || !month || !day || saving}
          className="w-full py-4 rounded-[14px] bg-accent-gold text-bg-deep text-base font-semibold disabled:opacity-40 transition-opacity mt-4 mb-8"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
