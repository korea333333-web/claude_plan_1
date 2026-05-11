'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import BottomNav from '@/components/BottomNav';
import InstallGuide from '@/components/InstallGuide';
import { HOLIDAY_PRESETS, SOLAR_TERM_PRESETS, SOLAR_TERM_SEASONS, type PresetItem } from '@/lib/presets';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const auth = useAuth();
  const user = auth.provider ? { name: auth.name, email: auth.email, provider: auth.provider, avatarUrl: auth.avatarUrl } : null;
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState<string | null>(null);
  const [gcalEmail, setGcalEmail] = useState<string | null>(null);
  const [gcalGuide, setGcalGuide] = useState(false);
  const [kakaoConnected, setKakaoConnected] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [kakaoError, setKakaoError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [addedPresets, setAddedPresets] = useState<Set<string>>(new Set());
  const [presetsLoading, setPresetsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('dalsaegim-theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);

    checkTelegramStatus();
    checkGcalStatus();
    checkKakaoStatus();

    // Handle OAuth callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'success') {
      setGcalConnected(true);
      checkGcalStatus();
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('gcal') === 'error') {
      setGcalError('구글 캘린더 연결에 실패했습니다');
      window.history.replaceState({}, '', '/settings');
    }
    if (params.get('kakao_talk') === 'success') {
      setKakaoConnected(true);
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('kakao_talk') === 'error') {
      setKakaoError('카카오톡 연결에 실패했습니다');
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  // auth 준비되면 프리셋 로드
  useEffect(() => {
    if (!auth.loading) loadPresets();
  }, [auth.loading, auth.userId]);

  async function checkTelegramStatus() {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setTelegramConnected(data.connected);
    } catch { /* skip */ }
  }

  async function checkGcalStatus() {
    try {
      const res = await fetch('/api/gcal/status');
      const data = await res.json();
      setGcalConnected(data.connected);
      if (data.email) setGcalEmail(data.email);
    } catch { /* skip */ }
  }

  async function checkKakaoStatus() {
    try {
      const res = await fetch('/api/kakao-talk/status');
      const data = await res.json();
      setKakaoConnected(data.connected);
    } catch { /* skip */ }
  }

  async function handleKakaoConnect() {
    if (kakaoLoading) return;
    setKakaoLoading(true);
    setKakaoError(null);
    try {
      const res = await fetch('/api/kakao-talk/connect', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setKakaoError(data.error);
        setKakaoLoading(false);
        return;
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
    } catch {
      setKakaoError('연결 요청 실패');
    }
    setKakaoLoading(false);
  }

  async function handleGcalConnect() {
    if (gcalLoading) return;
    if (!gcalGuide) {
      setGcalGuide(true);
      return;
    }
    setGcalLoading(true);
    setGcalError(null);
    try {
      const res = await fetch('/api/gcal/connect', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setGcalError(data.error);
        setGcalLoading(false);
        return;
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
    } catch {
      setGcalError('연결 요청 실패');
    }
    setGcalLoading(false);
  }

  async function handleDisconnect(channel: 'telegram' | 'gcal' | 'kakao') {
    const names = { telegram: '텔레그램', gcal: '구글 캘린더', kakao: '카카오톡' };
    if (!confirm(`${names[channel]} 연결을 해제할까요?`)) return;
    const apiPath = channel === 'kakao' ? 'kakao-talk' : channel;
    try {
      const res = await fetch(`/api/${apiPath}/disconnect`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (channel === 'telegram') {
          setTelegramConnected(false);
          setTelegramDeepLink(null);
        } else if (channel === 'gcal') {
          setGcalConnected(false);
          setGcalEmail(null);
          setGcalGuide(false);
        } else if (channel === 'kakao') {
          setKakaoConnected(false);
        }
      }
    } catch { /* skip */ }
  }

  async function handleTelegramConnect() {
    if (telegramLoading) return;
    setTelegramLoading(true);
    setTelegramError(null);
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST' });
      const data = await res.json();
      if (data.alreadyConnected) {
        setTelegramConnected(true);
        setTelegramLoading(false);
        return;
      }
      if (data.error) {
        setTelegramError(data.error);
        setTelegramLoading(false);
        return;
      }
      if (data.deepLink) {
        setTelegramDeepLink(data.deepLink);
        window.open(data.deepLink, '_blank');
        const poll = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/telegram/status');
            const statusData = await statusRes.json();
            if (statusData.connected) {
              setTelegramConnected(true);
              setTelegramDeepLink(null);
              clearInterval(poll);
            }
          } catch { /* skip */ }
        }, 3000);
        setTimeout(() => clearInterval(poll), 60000);
      }
    } catch {
      setTelegramError('연결 요청 실패');
    }
    setTelegramLoading(false);
  }

  function toggleTheme(newTheme: 'dark' | 'light') {
    setTheme(newTheme);
    localStorage.setItem('dalsaegim-theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  async function loadPresets() {
    const userId = auth.userId;
    if (!userId) { setPresetsLoading(false); return; }
    const { data } = await supabase
      .from('anniversaries')
      .select('name, date_type, month, day')
      .eq('user_id', userId);
    if (data) {
      const all = [...HOLIDAY_PRESETS, ...SOLAR_TERM_PRESETS];
      const added = new Set<string>();
      all.forEach(p => {
        if (data.some(d => d.name === p.name && d.date_type === p.date_type && d.month === p.month && d.day === p.day)) {
          added.add(p.key);
        }
      });
      setAddedPresets(added);
    }
    setPresetsLoading(false);
  }

  async function togglePreset(preset: PresetItem) {
    const userId = auth.userId;
    if (!userId) return;
    const isAdded = addedPresets.has(preset.key);
    if (isAdded) {
      await supabase.from('anniversaries').delete()
        .eq('user_id', userId).eq('name', preset.name)
        .eq('date_type', preset.date_type).eq('month', preset.month).eq('day', preset.day);
      setAddedPresets(prev => { const n = new Set(prev); n.delete(preset.key); return n; });
    } else {
      await supabase.from('anniversaries').insert({
        user_id: userId, name: preset.name, date_type: preset.date_type,
        month: preset.month, day: preset.day, category: preset.category,
        repeat_type: 'yearly', start_year: null, is_shared: false, is_leap_month: false,
        alarms: [
          { enabled: true, daysBefore: 7, hour: 9, minute: 0 },
          { enabled: true, daysBefore: 3, hour: 9, minute: 0 },
          { enabled: true, daysBefore: 0, hour: 9, minute: 0 },
        ],
      });
      setAddedPresets(prev => new Set([...prev, preset.key]));
    }
  }

  async function addAllPresets(presets: PresetItem[]) {
    const userId = auth.userId;
    if (!userId) return;
    const toAdd = presets.filter(p => !addedPresets.has(p.key));
    if (toAdd.length === 0) return;
    await supabase.from('anniversaries').insert(toAdd.map(p => ({
      user_id: userId, name: p.name, date_type: p.date_type,
      month: p.month, day: p.day, category: p.category,
      repeat_type: 'yearly', start_year: null, is_shared: false, is_leap_month: false,
      alarms: [
        { enabled: true, daysBefore: 7, hour: 9, minute: 0 },
        { enabled: true, daysBefore: 3, hour: 9, minute: 0 },
        { enabled: true, daysBefore: 0, hour: 9, minute: 0 },
      ],
    })));
    setAddedPresets(prev => { const n = new Set(prev); toAdd.forEach(p => n.add(p.key)); return n; });
  }

  async function removeAllPresets(presets: PresetItem[]) {
    const userId = auth.userId;
    if (!userId) return;
    const toRemove = presets.filter(p => addedPresets.has(p.key));
    if (toRemove.length === 0) return;
    for (const p of toRemove) {
      await supabase.from('anniversaries').delete()
        .eq('user_id', userId).eq('name', p.name)
        .eq('date_type', p.date_type).eq('month', p.month).eq('day', p.day);
    }
    setAddedPresets(prev => { const n = new Set(prev); toRemove.forEach(p => n.delete(p.key)); return n; });
  }

  function handleLogout() {
    window.location.href = '/api/auth/logout';
  }

  const notificationChannels = [
    {
      name: '텔레그램',
      desc: '봇 알림',
      connected: telegramConnected,
      iconType: 'telegram' as const,
      channelKey: 'telegram' as const,
      onConnect: handleTelegramConnect,
      loading: telegramLoading,
    },
    {
      name: '카카오톡',
      desc: '나에게 보내기로 알림',
      connected: kakaoConnected,
      iconType: 'kakao' as const,
      channelKey: 'kakao' as const,
      onConnect: handleKakaoConnect,
      loading: kakaoLoading,
    },
    {
      name: '구글 캘린더',
      desc: gcalEmail ? gcalEmail : '일정으로 자동 등록',
      connected: gcalConnected,
      iconType: 'gcal' as const,
      channelKey: 'gcal' as const,
      onConnect: handleGcalConnect,
      loading: gcalLoading,
    },
  ];

  const timingCards = [
    { level: '1차', when: '7일 전' },
    { level: '2차', when: '3일 전' },
    { level: '3차', when: '당일' },
  ];

  const holidayCount = HOLIDAY_PRESETS.filter(p => addedPresets.has(p.key)).length;
  const solarTermCount = SOLAR_TERM_PRESETS.filter(p => addedPresets.has(p.key)).length;

  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="min-h-dvh bg-bg-deep pb-28">
      {/* Header */}
      <div className="px-6 pt-[env(safe-area-inset-top,16px)] pb-5">
        <h1 className="text-[34px] font-extrabold tracking-[-1.5px] leading-none pt-4">설정</h1>
        <p className="text-[14px] text-text-secondary mt-2">알림 · 테마 · 계정 관리</p>
      </div>

      {/* Account */}
      <div className="mx-6 border-t border-border-strong border-b-[0.5px] border-b-border-subtle mb-5">
        <div
          className={`flex items-center gap-3.5 py-4 ${!user ? 'cursor-pointer' : ''}`}
          onClick={() => { if (!user) router.push('/login'); }}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-13 h-13 rounded-full object-cover" />
          ) : (
            <div className="w-13 h-13 rounded-full flex items-center justify-center text-[20px] font-bold text-bg-deep"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #8b6f47)' }}>
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="text-[18px] font-semibold tracking-[-0.3px]">{user?.name || '로그인 필요'}</div>
            <div className="text-[14px] text-text-secondary mt-0.5">
              {user ? `${user.provider === 'kakao' ? '카카오톡' : '구글'} 로그인` : '탭하여 로그인'}
            </div>
          </div>
          {!user && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      </div>

      {/* Logout */}
      {user && (
        <div className="px-6 mb-6">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-full border border-border-strong text-text-tertiary text-[15px] font-medium transition-colors cursor-pointer hover:border-text-tertiary"
          >
            로그아웃
          </button>
        </div>
      )}

      <div className="px-6 space-y-7">
        {/* Notification Channels */}
        <SettingsSection label="알림 채널">
          {notificationChannels.map((ch) => (
            <div key={ch.name} className="flex items-center gap-3.5 py-3.5 border-b-[0.5px] border-border-subtle last:border-b-0">
              <ChannelIcon type={ch.iconType} />
              <div className="flex-1">
                <div className="text-[16px] font-semibold">{ch.name}</div>
                <div className="text-[13px] text-text-secondary mt-0.5">{ch.desc}</div>
              </div>
              {ch.connected ? (
                <button
                  onClick={() => handleDisconnect(ch.channelKey as 'telegram' | 'gcal' | 'kakao')}
                  className="flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-accent-green group-hover:bg-red-400" />
                  <span className="text-[13px] text-accent-green font-semibold group-hover:text-red-400">연결됨</span>
                  <span className="text-[11px] text-text-tertiary hidden group-hover:inline">해제</span>
                </button>
              ) : (
                <button
                  onClick={ch.onConnect}
                  disabled={ch.loading || !user}
                  className="px-3.5 py-2 rounded-full bg-accent-gold-dim border-[0.5px] border-accent-gold text-accent-gold text-[14px] font-semibold disabled:opacity-40"
                >
                  {ch.loading ? '연결중...' : '연결하기'}
                </button>
              )}
            </div>
          ))}
          {(telegramError || gcalError || kakaoError) && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-[13px] text-red-400">{telegramError || gcalError || kakaoError}</p>
            </div>
          )}
          {gcalGuide && !gcalConnected && (
            <div className="mt-2 px-3.5 py-3 rounded-lg bg-[rgba(66,133,244,0.08)] border border-[rgba(66,133,244,0.2)]">
              <p className="text-[15px] font-bold text-[#4285f4] mb-3">반드시 확인하고 연결해주세요</p>
              <div className="text-[13px] text-text-secondary space-y-3">
                <div className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#4285f4] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <p>구글 로그인 화면이 나오면 <span className="text-text-primary font-semibold">본인 계정을 선택</span>하거나 로그인해주세요</p>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#4285f4] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="text-[14px] text-text-primary font-semibold mb-0.5">{'"'}Google에서 확인하지 않은 앱{'"'}</p>
                    <p>이 화면이 나오면 왼쪽 하단의 <span className="text-text-primary font-semibold">{'"'}계속{'"'}</span>을 눌러주세요</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#4285f4] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <p>액세스 허용 화면에서 <span className="text-text-primary font-semibold">{'"'}계속{'"'}</span>을 눌러주세요</p>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#4285f4] text-white text-[11px] font-bold flex items-center justify-center">4</span>
                  <p>앱을 신뢰할 수 있는지 확인 화면에서 <span className="text-text-primary font-semibold">{'"'}계속{'"'}</span>을 누르면 연결 완료!</p>
                </div>
              </div>
              <button
                onClick={handleGcalConnect}
                disabled={gcalLoading}
                className="mt-3.5 w-full py-2.5 rounded-full bg-[#4285f4] text-white text-[14px] font-semibold disabled:opacity-50"
              >
                {gcalLoading ? '연결중...' : '구글 로그인으로 이동'}
              </button>
            </div>
          )}
          {telegramDeepLink && !telegramConnected && (
            <div className="mt-2 px-3 py-2.5 rounded-lg bg-[rgba(0,136,204,0.08)] border border-[rgba(0,136,204,0.2)]">
              <p className="text-[13px] text-text-secondary mb-2">텔레그램이 자동으로 안 열렸나요?</p>
              <a
                href={telegramDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#0088cc] font-semibold underline break-all"
              >
                여기를 눌러 텔레그램에서 시작하기
              </a>
            </div>
          )}
        </SettingsSection>

        {/* Default Alarm Timing */}
        <SettingsSection label="기본 알림 시점">
          <div className="flex gap-2.5">
            {timingCards.map((t) => (
              <div key={t.level} className="flex-1 py-3.5 px-3 bg-accent-gold-dim border-[0.5px] border-accent-gold rounded-xl text-center">
                <div className="text-[12px] text-accent-gold-soft tracking-[1px] mb-1.5">{t.level}</div>
                <div className="text-[22px] text-accent-gold font-bold tracking-[-0.5px] leading-none">{t.when}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-lg bg-[rgba(201,169,110,0.06)] border border-[rgba(201,169,110,0.15)]">
            <p className="text-[13px] text-text-secondary leading-[1.6]">
              모든 기념일에 위 시점으로 알림이 발송됩니다.
              <br />
              <span className="text-accent-gold-soft">기념일 수정 화면</span>에서 개별 변경할 수 있어요.
            </p>
          </div>
        </SettingsSection>


        {/* Theme Toggle */}
        <SettingsSection label="화면 테마">
          <div className="flex gap-2.5">
            <button
              onClick={() => toggleTheme('dark')}
              className={`flex-1 py-3.5 px-3 rounded-xl text-center border-[0.5px] transition-all ${
                theme === 'dark'
                  ? 'bg-accent-gold-dim border-accent-gold'
                  : 'bg-bg-card border-border-strong'
              }`}
            >
              <div className="text-[20px] mb-1.5">🌙</div>
              <div className={`text-[15px] font-bold ${theme === 'dark' ? 'text-accent-gold' : 'text-text-secondary'}`}>다크</div>
            </button>
            <button
              onClick={() => toggleTheme('light')}
              className={`flex-1 py-3.5 px-3 rounded-xl text-center border-[0.5px] transition-all ${
                theme === 'light'
                  ? 'bg-accent-gold-dim border-accent-gold'
                  : 'bg-bg-card border-border-strong'
              }`}
            >
              <div className="text-[20px] mb-1.5">☀️</div>
              <div className={`text-[15px] font-bold ${theme === 'light' ? 'text-accent-gold' : 'text-text-secondary'}`}>라이트</div>
            </button>
          </div>
        </SettingsSection>

        {/* Install to Home Screen */}
        <SettingsSection label="앱 설치">
          <InstallGuide />
        </SettingsSection>

        {/* Built-in Holidays */}
        <SettingsSection label={`기본 내장 명절 (${holidayCount}/${HOLIDAY_PRESETS.length})`}>
          <div className="flex flex-wrap gap-2">
            {HOLIDAY_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => togglePreset(p)}
                disabled={presetsLoading || !user}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[14px] font-semibold border-[0.5px] transition-all disabled:opacity-40 ${
                  addedPresets.has(p.key)
                    ? 'bg-accent-gold-dim border-accent-gold text-accent-gold'
                    : 'bg-bg-card border-border-strong text-text-secondary font-medium'
                }`}
              >
                {p.name}
                <span className="text-[11px] opacity-60">{p.date_type === 'lunar' ? `${p.month}.${p.day}` : `${p.month}/${p.day}`}</span>
                {addedPresets.has(p.key) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => addAllPresets(HOLIDAY_PRESETS)}
              disabled={presetsLoading || !user || holidayCount === HOLIDAY_PRESETS.length}
              className="flex-1 py-2.5 rounded-xl bg-accent-gold-dim border-[0.5px] border-accent-gold text-accent-gold text-[13px] font-semibold disabled:opacity-30 transition-opacity"
            >
              전체 추가
            </button>
            <button
              onClick={() => removeAllPresets(HOLIDAY_PRESETS)}
              disabled={presetsLoading || !user || holidayCount === 0}
              className="flex-1 py-2.5 rounded-xl bg-bg-card border-[0.5px] border-border-strong text-text-secondary text-[13px] font-medium disabled:opacity-30 transition-opacity"
            >
              전체 삭제
            </button>
          </div>
        </SettingsSection>

        {/* 24 Solar Terms */}
        <SettingsSection label={`24절기 (${solarTermCount}/${SOLAR_TERM_PRESETS.length})`}>
          <div className="space-y-4">
            {SOLAR_TERM_SEASONS.map((season) => (
              <div key={season.label}>
                <div className="text-[12px] text-text-tertiary tracking-[1px] font-semibold mb-2">{season.label}</div>
                <div className="flex flex-wrap gap-2">
                  {season.keys.map((key) => {
                    const p = SOLAR_TERM_PRESETS.find(t => t.key === key)!;
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePreset(p)}
                        disabled={presetsLoading || !user}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[14px] font-semibold border-[0.5px] transition-all disabled:opacity-40 ${
                          addedPresets.has(p.key)
                            ? 'bg-accent-gold-dim border-accent-gold text-accent-gold'
                            : 'bg-bg-card border-border-strong text-text-secondary font-medium'
                        }`}
                      >
                        {p.name}
                        <span className="text-[11px] opacity-60">{p.month}/{p.day}</span>
                        {addedPresets.has(p.key) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => addAllPresets(SOLAR_TERM_PRESETS)}
              disabled={presetsLoading || !user || solarTermCount === SOLAR_TERM_PRESETS.length}
              className="flex-1 py-2.5 rounded-xl bg-accent-gold-dim border-[0.5px] border-accent-gold text-accent-gold text-[13px] font-semibold disabled:opacity-30 transition-opacity"
            >
              전체 추가
            </button>
            <button
              onClick={() => removeAllPresets(SOLAR_TERM_PRESETS)}
              disabled={presetsLoading || !user || solarTermCount === 0}
              className="flex-1 py-2.5 rounded-xl bg-bg-card border-[0.5px] border-border-strong text-text-secondary text-[13px] font-medium disabled:opacity-30 transition-opacity"
            >
              전체 삭제
            </button>
          </div>
        </SettingsSection>

        {/* Footer */}
        <div className="pt-4 border-t-[0.5px] border-border-subtle flex gap-4 text-[13px] text-text-tertiary pb-4">
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
      <div className="text-[13px] text-accent-gold font-bold tracking-[1.5px] mb-3">{label}</div>
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
    <div className={`w-10 h-10 rounded-[10px] border-[0.5px] flex items-center justify-center shrink-0 ${styles[type]}`}>
      {type === 'kakao' && (
        <svg width="18" height="18" viewBox="0 0 20 20">
          <path d="M10 3C5.58 3 2 5.87 2 9.35c0 2.2 1.45 4.13 3.63 5.25-.16.58-.58 2.1-.67 2.43-.1.4.15.4.31.29.13-.08 2.03-1.38 2.85-1.95.61.09 1.24.13 1.88.13 4.42 0 8-2.87 8-6.35S14.42 3 10 3z" fill="#3c1e1e" />
        </svg>
      )}
      {type === 'telegram' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0088cc">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      )}
      {type === 'gcal' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )}
    </div>
  );
}
