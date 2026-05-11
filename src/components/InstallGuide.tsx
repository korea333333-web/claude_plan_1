'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'unknown';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<any> };

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 이미 앱으로 열고 있는지 확인
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 이전에 닫기 누른 적 있으면 숨김
    const d = localStorage.getItem('dalsaegim-install-dismissed');
    if (d) setDismissed(true);

    // 기기 판별
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    }

    // Android Chrome 설치 프롬프트 가로채기
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 이미 앱으로 열고 있거나, 닫기 눌렀거나, PC면 표시 안 함
  if (isStandalone || dismissed || platform === 'unknown') return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('dalsaegim-install-dismissed', 'true');
  }

  return (
    <div className="relative px-4 py-4 bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.25)] rounded-2xl">
      {/* 닫기 */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bg-card-strong border border-border-strong flex items-center justify-center text-text-tertiary"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-gold-dim border border-accent-gold/30 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-gold">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex-1 pr-6">
          <div className="text-[15px] font-bold text-text-primary mb-1">바탕화면에 추가하기</div>
          <p className="text-[13px] text-text-secondary leading-[1.6] mb-3">
            앱처럼 바로 열 수 있어요. 카톡에서 매번 찾을 필요 없이!
          </p>

          {platform === 'ios' && (
            <div className="space-y-2">
              <Step num={1}>
                하단의 <InlineIcon type="share" /> <B>공유 버튼</B>을 누르세요
              </Step>
              <Step num={2}>
                아래로 스크롤해서 <B>&quot;홈 화면에 추가&quot;</B>를 선택
              </Step>
              <Step num={3}>
                오른쪽 상단 <B>&quot;추가&quot;</B>를 누르면 완료!
              </Step>
            </div>
          )}

          {platform === 'android' && !deferredPrompt && (
            <div className="space-y-2">
              <Step num={1}>
                오른쪽 상단 <InlineIcon type="menu" /> <B>메뉴(⋮)</B>를 누르세요
              </Step>
              <Step num={2}>
                <B>&quot;홈 화면에 추가&quot;</B> 또는 <B>&quot;앱 설치&quot;</B>를 선택
              </Step>
              <Step num={3}>
                <B>&quot;설치&quot;</B>를 누르면 완료!
              </Step>
            </div>
          )}

          {platform === 'android' && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-xl bg-accent-gold text-bg-deep text-[15px] font-bold"
            >
              지금 바탕화면에 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="shrink-0 w-5 h-5 rounded-full bg-accent-gold text-bg-deep text-[11px] font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <span className="text-[13px] text-text-secondary leading-[1.5]">{children}</span>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-text-primary font-semibold">{children}</span>;
}

function InlineIcon({ type }: { type: 'share' | 'menu' }) {
  if (type === 'share') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-[-2px] text-accent-gold">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block align-[-2px] text-accent-gold">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}
