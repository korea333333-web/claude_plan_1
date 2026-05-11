'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'unknown';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<any> };

const ICONS = [
  { id: '1', src: '/icons/app-icon-1.png' },
  { id: '2', src: '/icons/app-icon-2.png' },
  { id: '3', src: '/icons/app-icon-3.png' },
  { id: '4', src: '/icons/app-icon-4.png' },
];

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('3');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    }

    // 저장된 아이콘 선택 불러오기
    const saved = localStorage.getItem('dalsaegim-icon');
    if (saved) setSelectedIcon(saved);

    // Android Chrome 설치 프롬프트
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleSelectIcon(id: string) {
    setSelectedIcon(id);
    localStorage.setItem('dalsaegim-icon', id);
    // 쿠키도 설정 (매니페스트 API가 읽을 수 있도록)
    document.cookie = `dalsaegim-icon=${id};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    // apple-touch-icon도 동적 변경
    const link = document.querySelector('link[rel="apple-touch-icon"]');
    if (link) link.setAttribute('href', `/icons/app-icon-${id}.png`);
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  }

  // 이미 앱으로 열고 있으면 완료 표시
  if (isStandalone) {
    return (
      <div className="px-4 py-4 bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.25)] rounded-2xl text-center">
        <div className="text-[20px] mb-1">✅</div>
        <div className="text-[15px] font-bold text-accent-green">앱으로 실행 중!</div>
        <p className="text-[13px] text-text-secondary mt-1">바탕화면에서 잘 열고 계시네요</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-accent-gold/30">
      {/* 강력한 상단 배너 */}
      <div className="bg-gradient-to-br from-[rgba(201,169,110,0.15)] to-[rgba(201,169,110,0.05)] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[22px]">📱</span>
          <span className="text-[18px] font-extrabold text-text-primary tracking-[-0.5px]">
            바탕화면에 꼭 추가하세요!
          </span>
        </div>
        <p className="text-[14px] text-text-secondary leading-[1.7]">
          카톡 링크로 매번 찾아 들어오지 마세요.
          <br />
          <span className="text-accent-gold font-bold">바탕화면에 추가</span>하면 앱처럼 바로 열 수 있어요!
        </p>
      </div>

      {/* 아이콘 선택 */}
      <div className="px-5 py-4 border-t border-border-subtle">
        <div className="text-[13px] font-bold text-accent-gold tracking-[1px] mb-3">
          아이콘을 골라주세요
        </div>
        <div className="flex gap-3 justify-center">
          {ICONS.map((icon) => (
            <button
              key={icon.id}
              onClick={() => handleSelectIcon(icon.id)}
              className={`relative w-[68px] h-[68px] rounded-[16px] overflow-hidden border-[2.5px] transition-all ${
                selectedIcon === icon.id
                  ? 'border-accent-gold scale-110 shadow-[0_0_16px_rgba(201,169,110,0.4)]'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={icon.src} alt={`아이콘 ${icon.id}`} className="w-full h-full object-cover" />
              {selectedIcon === icon.id && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent-gold flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0d14" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 설치 방법 */}
      <div className="px-5 py-4 border-t border-border-subtle">
        {/* Android 자동 설치 가능한 경우 */}
        {platform === 'android' && deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 rounded-xl bg-accent-gold text-bg-deep text-[16px] font-bold flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            지금 바탕화면에 추가하기
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="w-full py-3 rounded-xl bg-accent-gold text-bg-deep text-[15px] font-bold flex items-center justify-center gap-2"
            >
              추가하는 방법 보기
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform ${showSteps ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showSteps && (
              <div className="mt-4 space-y-3">
                {platform === 'ios' ? (
                  <>
                    <Step num={1}>
                      Safari 하단의 <InlineIcon type="share" /> <B>공유 버튼</B>을 누르세요
                    </Step>
                    <Step num={2}>
                      목록에서 <B>&quot;홈 화면에 추가&quot;</B>를 찾아 누르세요
                    </Step>
                    <Step num={3}>
                      오른쪽 상단 <B>&quot;추가&quot;</B>를 누르면 완료!
                    </Step>
                    <div className="mt-3 px-3 py-2.5 rounded-lg bg-[rgba(201,169,110,0.06)] border border-[rgba(201,169,110,0.15)]">
                      <p className="text-[12px] text-text-tertiary leading-[1.6]">
                        ⚠️ 반드시 <span className="text-text-secondary font-semibold">Safari</span>에서 열어야 합니다.
                        카카오톡/인스타 내 브라우저에서는 추가가 안 돼요.
                      </p>
                    </div>
                  </>
                ) : platform === 'android' ? (
                  <>
                    <Step num={1}>
                      Chrome 오른쪽 상단 <InlineIcon type="menu" /> <B>메뉴(⋮)</B>를 누르세요
                    </Step>
                    <Step num={2}>
                      <B>&quot;홈 화면에 추가&quot;</B> 또는 <B>&quot;앱 설치&quot;</B>를 누르세요
                    </Step>
                    <Step num={3}>
                      <B>&quot;추가&quot;</B>를 누르면 바탕화면에 생겨요!
                    </Step>
                  </>
                ) : (
                  <>
                    <Step num={1}>
                      브라우저 메뉴를 열어주세요
                    </Step>
                    <Step num={2}>
                      <B>&quot;홈 화면에 추가&quot;</B> 또는 <B>&quot;앱 설치&quot;</B>를 선택하세요
                    </Step>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-accent-gold text-bg-deep text-[12px] font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <span className="text-[14px] text-text-secondary leading-[1.6]">{children}</span>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-text-primary font-semibold">{children}</span>;
}

function InlineIcon({ type }: { type: 'share' | 'menu' }) {
  if (type === 'share') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-[-3px] text-accent-gold">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-[-3px] text-accent-gold">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}
