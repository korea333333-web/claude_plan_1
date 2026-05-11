'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface WheelPickerProps {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}

const ITEM_H = 40;
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
      className="relative overflow-hidden rounded-xl bg-bg-card-strong border border-border-strong flex-1"
      style={{ height: ITEM_H * VISIBLE }}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-x-3 z-10 border-y border-accent-gold/20 pointer-events-none"
        style={{ top: PAD, height: ITEM_H }}
      />

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          scrollbarWidth: 'none',
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
                    ? 'text-[22px] font-bold text-accent-gold'
                    : dist === 1
                      ? 'text-[16px] font-medium text-text-secondary'
                      : 'text-[13px] text-text-tertiary'
                }`}
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
