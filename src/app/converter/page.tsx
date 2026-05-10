'use client';

import { useState } from 'react';
import { lunarToSolar, solarToLunar, formatSolarDate } from '@/lib/lunar';
import type { SolarDate, LunarDate } from '@/lib/lunar';
import BottomNav from '@/components/BottomNav';

export default function ConverterPage() {
  const [mode, setMode] = useState<'lunarToSolar' | 'solarToLunar'>('lunarToSolar');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [result, setResult] = useState<{ solar?: SolarDate; lunar?: LunarDate; formatted: string } | null>(null);
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
        setResult({
          solar,
          formatted: formatSolarDate(solar),
        });
      } else {
        const lunar = solarToLunar(y, m, d);
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const date = new Date(y, m - 1, d);
        setResult({
          lunar,
          formatted: `음력 ${lunar.year}년 ${lunar.month}월 ${lunar.day}일${lunar.isLeapMonth ? ' (윤달)' : ''} · ${weekdays[date.getDay()]}요일`,
        });
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

  const inputLabel = mode === 'lunarToSolar' ? '음력' : '양력';
  const outputLabel = mode === 'lunarToSolar' ? '양력' : '음력';
  const inputColor = mode === 'lunarToSolar' ? 'text-accent-lunar' : 'text-accent-solar';
  const outputColor = mode === 'lunarToSolar' ? 'text-accent-solar' : 'text-accent-lunar';

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="text-center px-6 pt-[env(safe-area-inset-top,16px)] pb-7">
        <h1 className="text-lg font-semibold mb-1 pt-4">음력 ↔ 양력 변환</h1>
        <p className="text-[13px] text-text-tertiary">날짜를 입력하면 바로 변환됩니다</p>
      </div>

      {/* Converter Card */}
      <div className="mx-5 bg-bg-card border border-border-card rounded-[28px] p-6 relative">
        {/* Input Section */}
        <div className="mb-6">
          <h3 className={`text-[11px] font-semibold tracking-[1.5px] uppercase mb-3.5 ${inputColor}`}>
            {inputLabel} (입력)
          </h3>
          <div className="flex gap-2">
            {[
              { label: '연도', value: year, setter: setYear, placeholder: '2026' },
              { label: '월', value: month, setter: setMonth, placeholder: '3' },
              { label: '일', value: day, setter: setDay, placeholder: '27' },
            ].map((field) => (
              <div key={field.label} className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                <div className="text-[10px] text-text-tertiary mb-1">{field.label}</div>
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full text-center text-xl font-semibold bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Divider + Swap */}
        <div className="h-px bg-border-card -mx-6 mb-6" />
        <button
          onClick={handleSwap}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-accent-gold flex items-center justify-center shadow-[0_4px_16px_rgba(201,169,110,0.3)] z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f1117">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#0f1117" strokeWidth="2" fill="none" />
          </svg>
        </button>

        {/* Output Section */}
        <div>
          <h3 className={`text-[11px] font-semibold tracking-[1.5px] uppercase mb-3.5 ${outputColor}`}>
            {outputLabel} (결과)
          </h3>
          <div className="flex gap-2">
            {result ? (
              mode === 'lunarToSolar' && result.solar ? (
                <>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">연도</div>
                    <div className="text-xl font-semibold">{result.solar.year}</div>
                  </div>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">월</div>
                    <div className="text-xl font-semibold">{result.solar.month}</div>
                  </div>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">일</div>
                    <div className="text-xl font-semibold">{result.solar.day}</div>
                  </div>
                </>
              ) : result.lunar ? (
                <>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">연도</div>
                    <div className="text-xl font-semibold">{result.lunar.year}</div>
                  </div>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">월</div>
                    <div className="text-xl font-semibold">{result.lunar.month}</div>
                  </div>
                  <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                    <div className="text-[10px] text-text-tertiary mb-1">일</div>
                    <div className="text-xl font-semibold">{result.lunar.day}</div>
                  </div>
                </>
              ) : null
            ) : (
              <div className="flex-1 bg-bg-input border border-border-card rounded-[14px] p-4 text-center">
                <div className="text-text-tertiary text-sm py-3">변환 버튼을 눌러주세요</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Button */}
      <div className="px-5 mt-5">
        <button
          onClick={handleConvert}
          disabled={!month || !day}
          className="w-full py-4 rounded-[14px] bg-accent-gold text-bg-deep text-base font-semibold disabled:opacity-40 transition-opacity"
        >
          변환하기
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mx-5 mt-5 p-5 bg-accent-gold/[0.06] border border-accent-gold/15 rounded-[20px] text-center">
          <div className="text-xs text-text-tertiary mb-2">변환 결과</div>
          <div className="text-2xl font-semibold text-accent-gold">{result.formatted}</div>
        </div>
      )}

      {error && (
        <div className="mx-5 mt-5 p-4 bg-accent-red/10 border border-accent-red/20 rounded-[14px] text-center text-sm text-accent-red">
          {error}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
