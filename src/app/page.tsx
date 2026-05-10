'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { enrichAnniversary, sortByDDay, groupByMonth, DEFAULT_ANNIVERSARIES } from '@/lib/anniversary';
import type { Anniversary, AnniversaryWithDDay } from '@/lib/anniversary';
import AnniversaryCard from '@/components/AnniversaryCard';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

export default function HomePage() {
  const [anniversaries, setAnniversaries] = useState<AnniversaryWithDDay[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadAnniversaries();
  }, []);

  async function loadAnniversaries() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      useDemoData();
      return;
    }

    const { data, error } = await supabase
      .from('anniversaries')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to load anniversaries:', error);
      useDemoData();
      return;
    }

    if (data && data.length > 0) {
      const enriched = data.map((a: Anniversary) => enrichAnniversary(a));
      setAnniversaries(sortByDDay(enriched));
    } else {
      useDemoData();
    }
    setLoading(false);
  }

  function useDemoData() {
    const demoData: Anniversary[] = DEFAULT_ANNIVERSARIES.map((d, i) => ({
      ...d,
      id: `demo-${i}`,
      user_id: 'demo',
      created_at: new Date().toISOString(),
    }));

    const enriched = demoData.map(a => enrichAnniversary(a));
    setAnniversaries(sortByDDay(enriched));
    setLoading(false);
  }

  const grouped = groupByMonth(anniversaries);
  const today = new Date();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}요일`;

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-5">
        <div className="flex justify-between items-center pt-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">
              <span className="text-accent-gold">달</span>새김
            </h1>
            <p className="text-[13px] text-text-tertiary mt-0.5">{todayStr}</p>
          </div>
          <div className="flex gap-3">
            <button className="w-9 h-9 rounded-full bg-bg-card border border-border-card flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px] text-text-secondary">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <Link href="/settings" className="w-9 h-9 rounded-full bg-bg-card border border-border-card flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[18px] h-[18px] text-text-secondary">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 10-16 0" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Anniversary List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : anniversaries.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #f0ece4 0%, #c9a96e 40%, rgba(201,169,110,0.3) 70%, transparent 100%)',
              opacity: 0.5,
            }}
          />
          <p className="text-text-secondary text-[15px] mb-2">아직 등록된 기념일이 없어요</p>
          <p className="text-text-tertiary text-[13px]">+ 버튼을 눌러 소중한 날을 새겨보세요</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month} className="px-5 mb-7">
            <h2 className="text-xs font-semibold tracking-[2px] uppercase text-text-tertiary px-1 mb-3.5">
              {month}
            </h2>
            <div className="flex flex-col gap-2.5">
              {items.map((ann) => (
                <AnniversaryCard key={ann.id} anniversary={ann} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <Link
        href="/add"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-accent-gold flex items-center justify-center shadow-[0_8px_24px_rgba(201,169,110,0.3)] z-40 transition-transform hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#0f1117" strokeWidth={2.5} className="w-6 h-6">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      <BottomNav />
    </div>
  );
}
