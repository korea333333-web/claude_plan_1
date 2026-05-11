'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  name: string;
  email: string;
  provider: 'google' | 'kakao';
  avatarUrl?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [builtInHolidays, setBuiltInHolidays] = useState({
    seollal: true,
    chuseok: true,
    buddha: true,
    daeboreum: false,
    dano: false,
    hansik: false,
    dongji: false,
    chilseok: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    // 1. Check Supabase auth (Google)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const prov = authUser.user_metadata?.provider || authUser.app_metadata?.provider;
      setUser({
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '사용자',
        email: authUser.email || '',
        provider: prov === 'kakao' ? 'kakao' : 'google',
        avatarUrl: authUser.user_metadata?.avatar_url,
      });
      return;
    }

    // 2. Check Kakao session
    try {
      const res = await fetch('/api/auth/kakao/session');
      const data = await res.json();
      if (data.user) {
        setUser({
          name: data.user.nickname,
          email: '',
          provider: 'kakao',
          avatarUrl: data.user.profileImage,
        });
      }
    } catch {
      // Kakao session check failed
    }
  }

  async function handleLogout() {
    if (user?.provider === 'kakao') {
      window.location.href = '/api/auth/kakao/logout';
    } else {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/login';
    }
  }

  const notificationChannels = [
    {
      name: '카카오톡',
      desc: '나에게 보내기로 알림',
      connected: true,
      iconType: 'kakao' as const,
    },
    {
      name: '텔레그램',
      desc: '봇 알림',
      connected: true,
      iconType: 'telegram' as const,
    },
    {
      name: '구글 캘린더',
      desc: '일정으로 자동 등록',
      connected: false,
      iconType: 'gcal' as const,
    },
  ];

  const timingCards = [
    { level: '1차', when: '7일 전' },
    { level: '2차', when: '3일 전' },
    { level: '3차', when: '당일' },
  ];

  const holidays: { key: keyof typeof builtInHolidays; name: string }[] = [
    { key: 'seollal', name: '설날' },
    { key: 'chuseok', name: '추석' },
    { key: 'buddha', name: '석가탄신일' },
    { key: 'daeboreum', name: '정월대보름' },
    { key: 'dano', name: '단오' },
    { key: 'hansik', name: '한식' },
    { key: 'dongji', name: '동지' },
    { key: 'chilseok', name: '칠석' },
  ];

  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-5">
        <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none pt-4">설정</h1>
        <p className="text-[11px] text-text-secondary mt-1.5">알림 · 가족 · 계정 관리</p>
      </div>

      {/* Account */}
      <div className="mx-6 border-t border-border-strong border-b-[0.5px] border-b-border-subtle mb-5">
        <div
          className={`flex items-center gap-3.5 py-4 ${!user ? 'cursor-pointer' : ''}`}
          onClick={() => { if (!user) router.push('/login'); }}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold text-bg-deep"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #8b6f47)' }}>
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="text-[16px] font-semibold tracking-[-0.3px]">{user?.name || '로그인 필요'}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              {user ? `${user.provider === 'kakao' ? '카카오톡' : '구글'} 로그인` : '탭하여 로그인'}
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Logout */}
      {user && (
        <div className="px-6 mb-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-full border border-border-strong text-text-tertiary text-[13px] font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}

      <div className="px-6 space-y-6">
        {/* Notification Channels */}
        <SettingsSection label="알림 채널">
          {notificationChannels.map((ch) => (
            <div key={ch.name} className="flex items-center gap-3.5 py-3 border-b-[0.5px] border-border-subtle last:border-b-0">
              <ChannelIcon type={ch.iconType} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{ch.name}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">{ch.desc}</div>
              </div>
              {ch.connected ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  <span className="text-[10px] text-accent-green font-semibold">연결됨</span>
                </div>
              ) : (
                <button className="px-3 py-1.5 rounded-full bg-accent-gold-dim border-[0.5px] border-accent-gold text-accent-gold text-[11px] font-semibold">
                  연결하기
                </button>
              )}
            </div>
          ))}
        </SettingsSection>

        {/* Default Alarm Timing */}
        <SettingsSection label="기본 알림 시점">
          <div className="flex gap-2">
            {timingCards.map((t) => (
              <div key={t.level} className="flex-1 py-3 px-2.5 bg-accent-gold-dim border-[0.5px] border-accent-gold rounded-xl text-center">
                <div className="text-[9px] text-accent-gold-soft tracking-[1px] mb-1">{t.level}</div>
                <div className="text-[18px] text-accent-gold font-bold tracking-[-0.5px] leading-none">{t.when}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-tertiary mt-2 text-center">탭해서 변경 · 새 기념일에 기본 적용</p>
        </SettingsSection>

        {/* Family Group */}
        <SettingsSection label="가족 그룹">
          <div className="flex items-center gap-3 py-3 border-b-[0.5px] border-border-subtle">
            <div className="flex shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-bg-deep border-[1.5px] border-bg-deep"
                style={{ background: 'linear-gradient(135deg, #c9a96e, #8b6f47)' }}>
                {initials}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold">우리 가족</div>
              <div className="text-[10px] text-text-secondary mt-0.5">1명</div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <button className="w-full py-3 flex items-center justify-center gap-1.5 text-accent-gold text-[12px] font-semibold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            카카오톡으로 가족 초대
          </button>
        </SettingsSection>

        {/* Built-in Holidays */}
        <SettingsSection label="기본 내장 명절">
          <div className="flex flex-wrap gap-1.5">
            {holidays.map((h) => (
              <button
                key={h.key}
                onClick={() => setBuiltInHolidays(prev => ({ ...prev, [h.key]: !prev[h.key] }))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border-[0.5px] transition-all ${
                  builtInHolidays[h.key]
                    ? 'bg-accent-gold-dim border-accent-gold text-accent-gold'
                    : 'bg-bg-card border-border-strong text-text-secondary font-medium'
                }`}
              >
                {h.name}
                {builtInHolidays[h.key] && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Footer */}
        <div className="pt-4 border-t-[0.5px] border-border-subtle flex gap-3.5 text-[10px] text-text-tertiary pb-4">
          <span>이용약관</span>
          <span>·</span>
          <span>개인정보처리방침</span>
          <span>·</span>
          <span>v1.0.0</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-accent-gold font-bold tracking-[2px] mb-3">{label}</div>
      {children}
    </div>
  );
}

function ChannelIcon({ type }: { type: 'kakao' | 'telegram' | 'gcal' }) {
  const styles = {
    kakao: 'bg-[rgba(255,235,59,0.12)] border-[rgba(255,235,59,0.3)]',
    telegram: 'bg-[rgba(0,136,204,0.12)] border-[rgba(0,136,204,0.3)]',
    gcal: 'bg-[rgba(66,133,244,0.12)] border-[rgba(66,133,244,0.3)]',
  };

  return (
    <div className={`w-9 h-9 rounded-[10px] border-[0.5px] flex items-center justify-center shrink-0 ${styles[type]}`}>
      {type === 'kakao' && (
        <svg width="16" height="16" viewBox="0 0 20 20">
          <path d="M10 3C5.58 3 2 5.87 2 9.35c0 2.2 1.45 4.13 3.63 5.25-.16.58-.58 2.1-.67 2.43-.1.4.15.4.31.29.13-.08 2.03-1.38 2.85-1.95.61.09 1.24.13 1.88.13 4.42 0 8-2.87 8-6.35S14.42 3 10 3z" fill="#3c1e1e" />
        </svg>
      )}
      {type === 'telegram' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      )}
      {type === 'gcal' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )}
    </div>
  );
}
