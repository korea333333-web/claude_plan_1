'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  name: string;
  email: string;
  provider: string;
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
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser({
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '사용자',
        email: authUser.email || '',
        provider: authUser.app_metadata?.provider || 'email',
      });
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const notificationChannels = [
    {
      icon: '💬',
      iconBg: 'bg-[rgba(254,229,0,0.15)]',
      name: '카카오톡',
      desc: '나에게 보내기',
      connected: true,
    },
    {
      icon: '✈',
      iconBg: 'bg-[rgba(0,136,204,0.12)]',
      name: '텔레그램',
      desc: '봇 알림',
      connected: false,
    },
    {
      icon: '📅',
      iconBg: 'bg-[rgba(66,133,244,0.12)]',
      name: '구글 캘린더',
      desc: '일정 자동 등록',
      connected: false,
    },
  ];

  const alarmDefaults = [
    { label: '1차 알림', value: '7일 전' },
    { label: '2차 알림', value: '3일 전' },
    { label: '3차 알림', value: '당일' },
  ];

  const holidays = [
    { key: 'seollal' as const, name: '설날' },
    { key: 'chuseok' as const, name: '추석' },
    { key: 'buddha' as const, name: '석가탄신일' },
    { key: 'daeboreum' as const, name: '정월대보름' },
    { key: 'dano' as const, name: '단오' },
  ];

  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-6">
        <h1 className="text-lg font-semibold pt-4">설정</h1>
      </div>

      {/* Account */}
      <Section label="계정">
        <div
          className={`flex items-center gap-3.5 px-4 py-4 ${!user ? 'cursor-pointer' : ''}`}
          onClick={() => { if (!user) router.push('/login'); }}
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-gold to-accent-lunar flex items-center justify-center text-lg font-semibold text-bg-deep">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">{user?.name || '로그인 필요'}</div>
            <div className="text-xs text-text-tertiary">
              {user ? `${user.provider === 'kakao' ? '카카오' : '구글'} 로그인` : '탭하여 로그인'}
            </div>
          </div>
          <span className="text-text-tertiary">›</span>
        </div>
      </Section>

      {/* Logout - 계정 바로 아래 */}
      {user && (
        <div className="px-5 -mt-4 mb-7">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-[14px] border border-border-card text-text-tertiary text-sm font-medium hover:bg-bg-card transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* Notification Channels */}
      <Section label="알림 채널">
        {notificationChannels.map((ch) => (
          <SettingItem key={ch.name}>
            <div className="flex items-center gap-3.5 flex-1">
              <div className={`w-9 h-9 rounded-[10px] ${ch.iconBg} flex items-center justify-center text-lg`}>
                {ch.icon}
              </div>
              <div>
                <div className="text-sm font-medium">{ch.name}</div>
                <div className="text-xs text-text-tertiary">{ch.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                ch.connected
                  ? 'text-accent-green bg-[rgba(125,184,138,0.12)]'
                  : 'text-text-tertiary bg-bg-input'
              }`}>
                {ch.connected ? '연결됨' : '연결하기'}
              </span>
              <span className="text-text-tertiary">›</span>
            </div>
          </SettingItem>
        ))}
      </Section>

      {/* Default Alarms */}
      <Section label="기본 알림 시점">
        {alarmDefaults.map((alarm) => (
          <SettingItem key={alarm.label}>
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-[10px] bg-accent-lunar-dim flex items-center justify-center text-lg">🔔</div>
              <div className="text-sm font-medium">{alarm.label}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-tertiary">{alarm.value}</span>
              <span className="text-text-tertiary">›</span>
            </div>
          </SettingItem>
        ))}
      </Section>

      {/* Built-in Holidays */}
      <Section label="기본 내장 기념일">
        {holidays.map((holiday) => (
          <SettingItem key={holiday.key}>
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-[10px] bg-accent-solar-dim flex items-center justify-center text-lg">🌙</div>
              <div className="text-sm font-medium">{holiday.name}</div>
            </div>
            <button
              onClick={() => setBuiltInHolidays(prev => ({ ...prev, [holiday.key]: !prev[holiday.key] }))}
              className={`w-11 h-[26px] rounded-full relative transition-colors ${
                builtInHolidays[holiday.key] ? 'bg-accent-gold' : 'bg-text-tertiary'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-[3px] transition-transform ${
                builtInHolidays[holiday.key] ? 'translate-x-[21px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </SettingItem>
        ))}
      </Section>

      {/* Family */}
      <Section label="가족 그룹">
        <SettingItem>
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-9 h-9 rounded-[10px] bg-accent-gold-dim flex items-center justify-center text-lg">👨‍👩‍👧‍👦</div>
            <div>
              <div className="text-sm font-medium">우리 가족</div>
              <div className="text-xs text-text-tertiary">1명</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-tertiary">관리</span>
            <span className="text-text-tertiary">›</span>
          </div>
        </SettingItem>
        <SettingItem>
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-9 h-9 rounded-[10px] bg-accent-gold-dim flex items-center justify-center text-lg">➕</div>
            <div className="text-sm font-medium text-accent-gold">카카오톡으로 초대</div>
          </div>
          <span className="text-text-tertiary">›</span>
        </SettingItem>
      </Section>

      <BottomNav />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 mb-7">
      <h2 className="text-[11px] font-semibold tracking-[1.5px] uppercase text-text-tertiary px-1 mb-2.5">{label}</h2>
      <div className="bg-bg-card border border-border-card rounded-[20px] overflow-hidden divide-y divide-border-subtle">
        {children}
      </div>
    </div>
  );
}

function SettingItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      {children}
    </div>
  );
}
