'use client';

import { useState } from 'react';
import { lunarToSolar, solarToLunar } from '@/lib/lunar';
import type { SolarDate, LunarDate } from '@/lib/lunar';
import BottomNav from '@/components/BottomNav';

export default function ConverterPage() {
  const [mode, setMode] = useState<'lunarToSolar' | 'solarToLunar'>('lunarToSolar');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [result, setResult] = useState<{ solar?: SolarDate; lunar?: LunarDate } | null>(null);
  const [error, setError] = useState('');

  function handleConvert() {
    setError('');
    setResult(null);

    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('올바른 날짜를 입력해주세요');
      return;
    }

    try {
      if (mode === 'lunarToSolar') {
        const solar = lunarToSolar(y, m, d);
        setResult({ solar });
      } else {
        const lunar = solarToLunar(y, m, d);
        setResult({ lunar });
      }
    } catch {
      setError('변환할 수 없는 날짜입니다');
    }
  }

  function handleSwap() {
    setMode(mode === 'lunarToSolar' ? 'solarToLunar' : 'lunarToSolar');
    setResult(null);
    setError('');
  }

  function handleToday() {
    const today = new Date();
    if (mode === 'solarToLunar') {
      setYear(today.getFullYear().toString());
      setMonth((today.getMonth() + 1).toString());
      setDay(today.getDate().toString());
    } else {
      const lunar = solarToLunar(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setYear(lunar.year.toString());
      setMonth(lunar.month.toString());
      setDay(lunar.day.toString());
    }
    setResult(null);
  }

  const isLunarInput = mode === 'lunarToSolar';
  const inputLabel = isLunarInput ? '음력' : '양력';
  const outputLabel = isLunarInput ? '양력' : '음력';
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const outputDate = result
    ? isLunarInput && result.solar
      ? result.solar
      : !isLunarInput && result.lunar
        ? result.lunar
        : null
    : null;

  const outputMeta = (() => {
    if (!outputDate) return '';
    if (isLunarInput && result?.solar) {
      const d = new Date(result.solar.year, result.solar.month - 1, result.solar.day);
      return `${weekdays[d.getDay()]}요일`;
    }
    if (!isLunarInput && result?.lunar) {
      return result.lunar.isLeapMonth ? '윤달' : '';
    }
    return '';
  })();

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-5">
        <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none pt-4">변환</h1>
        <p className="text-[14px] text-text-secondary mt-2">음력과 양력을 자유롭게 오가기</p>
      </div>

      {/* Direction toggle */}
      <div className="px-6 pb-5">
        <div className="flex bg-bg-card border border-border-strong rounded-full p-1">
          <button
            onClick={() => { setMode('lunarToSolar'); setResult(null); }}
            className={`flex-1 py-3 rounded-full text-[15px] font-medium text-center flex items-center justify-center gap-2 transition-all ${
              mode === 'lunarToSolar' ? 'bg-accent-gold text-bg-deep font-bold' : 'text-text-secondary'
            }`}
          >
            음 <span className="text-[13px]">→</span> 양
          </button>
          <button
            onClick={() => { setMode('solarToLunar'); setResult(null); }}
            className={`flex-1 py-3 rounded-full text-[15px] font-medium text-center flex items-center justify-center gap-2 transition-all ${
              mode === 'solarToLunar' ? 'bg-accent-gold text-bg-deep font-bold' : 'text-text-secondary'
            }`}
          >
            양 <span className="text-[13px]">→</span> 음
          </button>
        </div>
      </div>

      {/* Input card */}
      <div className={`mx-6 rounded-2xl p-[18px] border-[0.5px] ${
        isLunarInput
          ? 'bg-[rgba(201,169,110,0.06)] border-[rgba(201,169,110,0.3)]'
          : 'bg-[rgba(139,157,195,0.06)] border-[rgba(139,157,195,0.3)]'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className={`flex items-center gap-2 text-[14px] font-bold tracking-[1.5px] ${isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>
            <span className={`w-[7px] h-[7px] ${isLunarInput ? 'bg-accent-gold' : 'bg-accent-solar'}`} />
            {inputLabel}
          </div>
          <button onClick={handleToday} className="text-[14px] text-text-secondary">오늘</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '년', value: year, setter: setYear },
            { label: '월', value: month, setter: setMonth },
            { label: '일', value: day, setter: setDay },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[13px] text-text-tertiary tracking-[1px] mb-1.5">{f.label}</div>
              <div className="bg-bg-card border border-border-strong rounded-lg">
                <input
                  type="number"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="w-full text-center text-[22px] font-bold tracking-[-0.5px] bg-transparent outline-none text-text-primary py-3.5 px-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Swap */}
      <div className="relative text-center py-4">
        <div className="absolute top-1/2 left-6 right-6 h-[0.5px] bg-border-subtle" />
        <button
          onClick={handleSwap}
          className="relative w-11 h-11 rounded-full bg-bg-deep border border-accent-gold-dim inline-flex items-center justify-center text-accent-gold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        </button>
      </div>

      {/* Output card */}
      <div className={`mx-6 rounded-2xl p-[18px] border-[0.5px] ${
        !isLunarInput
          ? 'bg-[rgba(201,169,110,0.06)] border-[rgba(201,169,110,0.3)]'
          : 'bg-[rgba(139,157,195,0.06)] border-[rgba(139,157,195,0.3)]'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className={`flex items-center gap-2 text-[14px] font-bold tracking-[1.5px] ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>
            <span className={`w-[7px] h-[7px] ${!isLunarInput ? 'bg-accent-gold' : 'bg-accent-solar'}`} />
            {outputLabel}
          </div>
        </div>
        {outputDate ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-[42px] font-bold tracking-[-1.8px] leading-none ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>{outputDate.year}</span>
              <span className={`text-[28px] opacity-55 font-light ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>.</span>
              <span className={`text-[42px] font-bold tracking-[-1.8px] leading-none ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>{outputDate.month}</span>
              <span className={`text-[28px] opacity-55 font-light ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>.</span>
              <span className={`text-[42px] font-bold tracking-[-1.8px] leading-none ${!isLunarInput ? 'text-accent-gold' : 'text-accent-solar'}`}>{outputDate.day}</span>
            </div>
            {outputMeta && <p className="text-[15px] text-text-secondary mt-1.5">{outputMeta}</p>}
          </>
        ) : (
          <p className="text-text-tertiary text-[16px] py-6 text-center">변환 버튼을 눌러주세요</p>
        )}
      </div>

      {/* Convert button */}
      <div className="px-6 mt-5">
        <button
          onClick={handleConvert}
          disabled={!month || !day}
          className="w-full py-4 rounded-full bg-accent-gold text-bg-deep text-[17px] font-bold disabled:opacity-40 transition-opacity"
        >
          변환하기
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl text-center text-[15px] text-accent-red">
          {error}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
