'use client';

import { useState } from 'react';
import WheelPicker from './WheelPicker';

interface DatePickerSheetProps {
  month: number;
  day: number;
  onConfirm: (month: number, day: number) => void;
}

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function DatePickerSheet({ month, day, onConfirm }: DatePickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempDay, setTempDay] = useState(day);

  function handleOpen() {
    setTempMonth(month);
    setTempDay(day);
    setOpen(true);
  }

  function handleConfirm() {
    onConfirm(tempMonth, tempDay);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-3.5 bg-bg-card-strong border border-border-strong rounded-xl text-[16px] text-text-primary text-left flex items-center justify-between transition-colors"
      >
        <span>
          <span className="text-accent-gold font-bold text-[22px]">{month}</span>
          <span className="text-text-secondary text-[16px]">월 </span>
          <span className="text-accent-gold font-bold text-[22px]">{day}</span>
          <span className="text-text-secondary text-[16px]">일</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-[500px] bg-bg-card-strong rounded-t-2xl pb-[env(safe-area-inset-bottom,16px)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button
                onClick={() => setOpen(false)}
                className="text-text-secondary text-[16px]"
              >
                취소
              </button>
              <span className="text-[16px] font-bold text-text-primary">날짜 선택</span>
              <button
                onClick={handleConfirm}
                className="text-accent-gold text-[16px] font-bold"
              >
                확인
              </button>
            </div>

            <div className="flex gap-3 px-6 py-4">
              <WheelPicker items={months} value={tempMonth} onChange={setTempMonth} suffix="월" />
              <WheelPicker items={days} value={tempDay} onChange={setTempDay} suffix="일" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
