'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { enrichAnniversary, sortByDDay, groupByMonth, DEFAULT_ANNIVERSARIES } from '@/lib/anniversary';
import { solarToLunar } from '@/lib/lunar';
import type { Anniversary, AnniversaryWithDDay } from '@/lib/anniversary';
import AnniversaryCard from '@/components/AnniversaryCard';
import MoonPhase from '@/components/MoonPhase';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

interface AuthUser {
  name: string;
  provider: 'google' | 'kakao';
  avatarUrl?: string;
}

export default function HomePage() {
  const [anniversaries, setAnniversaries] = useState<AnniversaryWithDDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const prov = user.user_metadata?.provider || user.app_metadata?.provider;
      setAuthUser({
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
        provider: prov === 'kakao' ? 'kakao' : 'google',
        avatarUrl: user.user_metadata?.avatar_url,
      });
      await loadAnniversaries(user.id);
      return;
    }

    try {
      const res = await fetch('/api/auth/kakao/session');
      const data = await res.json();
      if (data.user) {
        setAuthUser({
          name: data.user.nickname,
          provider: 'kakao',
          avatarUrl: data.user.profileImage,
        });
      }
    } catch {
      // Kakao session check failed
    }

    useDemoData();
  }

  async function loadAnniversaries(userId: string) {
    const { data, error } = await supabase
      .from('anniversaries')
      .select('*')
      .eq('user_id', userId);

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
  const todayStr = `${today.getFullYear()} · ${String(today.getMonth() + 1).padStart(2, '0')} · ${String(today.getDate()).padStart(2, '0')} ${weekdays[today.getDay()]}요일`;

  const lunarToday = solarToLunar(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const lunarDayNum = lunarToday.day;

  function getMoonPhaseName(day: number) {
    if (day === 1) return '삭';
    if (day <= 6) return '초승달';
    if (day <= 8) return '상현달';
    if (day <= 14) return '차오르는 달';
    if (day <= 16) return '보름달';
    if (day <= 21) return '기우는 달';
    if (day <= 23) return '하현달';
    return '그믐달';
  }

  function getMoonCountdown(day: number) {
    if (day <= 14) return { target: '보름', days: 15 - day };
    return { target: '그믐', days: 29 - day };
  }

  const phaseName = getMoonPhaseName(lunarDayNum);
  const countdown = getMoonCountdown(lunarDayNum);

  const firstName = authUser?.name?.charAt(0) || '';

  return (
    <div className="min-h-dvh bg-bg-deep pb-28 relative">
      {/* Night gradient */}
      <div className="absolute top-0 left-0 right-0 h-[320px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 15%, rgba(60,80,140,0.15) 0%, transparent 50%)' }} />

      {/* Top bar */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-[env(safe-area-inset-top,16px)]">
        <span className="text-[13px] text-accent-gold-soft tracking-[3px] font-semibold pt-4">달새김</span>
        <div className="flex gap-2.5 pt-4">
          <button className="w-9 h-9 rounded-full bg-bg-card-strong border border-border-card flex items-center justify-center relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-accent-gold rounded-full" />
          </button>
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #c9a96e, #8b6f47)', color: '#0a0d14' }}>
            {authUser?.avatarUrl ? (
              <img src={authUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : firstName || '김'}
          </Link>
        </div>
      </div>

      {/* Wordmark + Moon */}
      <div className="relative z-10 px-6 pt-[30px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[56px] font-black tracking-[-3px] leading-[0.95]">달새김</h1>
            <p className="text-[15px] text-text-secondary mt-3">소중한 날을 달에 새기다</p>
            <p className="text-[12px] text-accent-gold-soft tracking-[4px] font-medium mt-1.5">DALSAEGIM</p>
          </div>
          <div className="text-center mt-1 shrink-0 ml-3">
            <MoonPhase lunarDay={lunarDayNum} size={64} />
            <p className="text-[14px] text-accent-gold font-bold mt-1">{phaseName}</p>
            <p className="text-[12px] text-text-secondary mt-0.5">D-{countdown.days}</p>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="relative z-10 px-6 pt-9">
        <p className="text-[14px] text-text-secondary tracking-[1px]">{todayStr}</p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-[18px] text-accent-gold-soft font-medium">음</span>
          <span className="text-[42px] text-accent-gold font-bold tracking-[-1.8px] leading-none">
            {lunarToday.month}.{lunarToday.day}
          </span>
        </div>
      </div>

      {/* Events */}
      <div className="relative z-10 px-6 pt-6">
        <div className="flex justify-between items-baseline pb-2.5 border-b border-border-strong">
          <h2 className="text-[14px] font-bold tracking-[1.5px]">기념일</h2>
          <div className="flex gap-2.5 items-center">
            <span className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <span className="w-[6px] h-[6px] bg-accent-gold rounded-none" />음력
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <span className="w-[6px] h-[6px] bg-accent-solar rounded-none" />양력
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          </div>
        ) : anniversaries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary text-[17px] mb-2">아직 등록된 기념일이 없어요</p>
            <p className="text-text-tertiary text-[15px]">+ 버튼을 눌러 소중한 날을 새겨보세요</p>
          </div>
        ) : (
          <div className="pt-2">
            {anniversaries.map((ann) => (
              <AnniversaryCard key={ann.id} anniversary={ann} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/add"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-accent-gold flex items-center justify-center shadow-[0_8px_24px_rgba(201,169,110,0.3)] z-40 transition-transform hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#0a0d14" strokeWidth={2.5} className="w-6 h-6">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      <BottomNav />
    </div>
  );
}
