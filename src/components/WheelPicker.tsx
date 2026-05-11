'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface WheelPickerProps {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = Math.floor(VISIBLE / 2) * ITEM_H;

export default function WheelPicker({ items, value, onChange, suffix = '' }: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [centerIdx, setCenterIdx] = useState(() => {
    const idx = items.indexOf(value);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetIdx = items.indexOf(value);
    if (targetIdx < 0) return;
    const currentIdx = Math.round(el.scrollTop / ITEM_H);
    if (currentIdx === targetIdx) return;
    el.scrollTop = targetIdx * ITEM_H;
    setCenterIdx(targetIdx);
  }, [value, items]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    setCenterIdx(clamped);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const finalIdx = Math.round(el.scrollTop / ITEM_H);
      const final = Math.max(0, Math.min(finalIdx, items.length - 1));
      if (items[final] !== undefined) {
        onChange(items[final]);
      }
    }, 150);
  }, [items, onChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const currentIdx = Math.round(el.scrollTop / ITEM_H);
    const dir = e.deltaY > 0 ? 1 : -1;
    const nextIdx = Math.max(0, Math.min(currentIdx + dir, items.length - 1));
    el.scrollTo({ top: nextIdx * ITEM_H, behavior: 'smooth' });
  }, [items.length]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-bg-picker flex-1"
      style={{ height: ITEM_H * VISIBLE }}
      onWheel={handleWheel}
    >
      {/* Selection highlight band */}
      <div
        className="absolute inset-x-0 z-10 bg-bg-picker-highlight pointer-events-none"
        style={{ top: PAD, height: ITEM_H }}
      >
        <div className="absolute inset-x-4 top-0 h-[1.5px] bg-accent-gold/40 rounded-full" />
        <div className="absolute inset-x-4 bottom-0 h-[1.5px] bg-accent-gold/40 rounded-full" />
      </div>

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: PAD }} />
        {items.map((item, i) => {
          const dist = Math.abs(i - centerIdx);
          return (
            <div
              key={item}
              className="flex items-center justify-center select-none"
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              <span
                className={`transition-all duration-100 ${
                  dist === 0
                    ? 'text-[24px] font-bold text-accent-gold'
                    : dist === 1
                      ? 'text-[17px] font-medium text-text-secondary'
                      : 'text-[14px] text-text-tertiary'
                }`}
                style={dist >= 2 ? { opacity: 0.5 } : undefined}
              >
                {item}{suffix}
              </span>
            </div>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}
