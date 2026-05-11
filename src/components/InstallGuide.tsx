'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'unknown';
type IOSBrowser = 'safari' | 'kakaotalk' | 'instagram' | 'chrome' | 'other-app';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<any> };

const ICONS = [
  { id: '1', src: '/icons/app-icon-1.png' },
  { id: '2', src: '/icons/app-icon-2.png' },
  { id: '3', src: '/icons/app-icon-3.png' },
  { id: '4', src: '/icons/app-icon-4.png' },
];

function detectiOSBrowser(): IOSBrowser {
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'other-app';
  if (/Line\//i.test(ua)) return 'other-app';
  if (/CriOS/i.test(ua)) return 'chrome';
  if (/FxiOS/i.test(ua)) return 'other-app';
  // iOS에서 위에 해당 안 하면 Safari
  return 'safari';
}

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [iosBrowser, setIOSBrowser] = useState<IOSBrowser>('safari');
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('3');
  const [showSteps, setShowSteps] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
      setIOSBrowser(detectiOSBrowser());
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    }

    const saved = localStorage.getItem('dalsaegim-icon');
    if (saved) setSelectedIcon(saved);

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
    document.cookie = `dalsaegim-icon=${id};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    const link = document.querySelector('link[rel="apple-touch-icon"]');
    if (link) link.setAttribute('href', `/icons/app-icon-${id}.png`);
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = window.location.origin;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  // 이미 앱으로 열고 있으면
  if (isStandalone) {
    return (
      <div className="px-4 py-4 bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.25)] rounded-2xl text-center">
        <div className="text-[20px] mb-1">✅</div>
        <div className="text-[15px] font-bold text-accent-green">앱으로 실행 중!</div>
        <p className="text-[13px] text-text-secondary mt-1">바탕화면에서 잘 열고 계시네요</p>
      </div>
    );
  }

  // iOS + Safari가 아닌 브라우저 (카톡, 인스타, 크롬 등)
  const needsSafari = platform === 'ios' && iosBrowser !== 'safari';

  return (
    <div className="rounded-2xl overflow-hidden border border-accent-gold/30">
      {/* 상단 배너 */}
      <div className="bg-gradient-to-br from-[rgba(201,169,110,0.15)] to-[rgba(201,169,110,0.05)] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[22px]">📱</span>
          <span className="text-[18px] font-extrabold text-text-primary tracking-[-0.5px]">
            바탕화면에 꼭 추가하세요!
          </span>
        </div>
        <p className="text-[14px] text-text-secondary leading-[1.7]">
          매번 카톡 링크 찾지 마세요.
          <br />
          <span className="text-accent-gold font-bold">바탕화면에 추가</span>하면 앱처럼 바로 열 수 있어요!
        </p>
      </div>

      {/* iOS인데 Safari가 아닌 경우 — Safari로 먼저 유도 */}
      {needsSafari && (
        <div className="px-5 py-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center">
              <span className="text-[12px]">⚠️</span>
            </span>
            <span className="text-[14px] font-bold text-text-primary">
              {iosBrowser === 'kakaotalk' ? '카카오톡' : iosBrowser === 'instagram' ? '인스타그램' : iosBrowser === 'chrome' ? 'Chrome' : '현재'} 브라우저에서는 추가가 안 돼요
            </span>
          </div>

          <p className="text-[13px] text-text-secondary leading-[1.6] mb-4">
            아이폰은 <span className="text-text-primary font-semibold">Safari에서만</span> 바탕화면에 추가할 수 있어요.
            {iosBrowser === 'kakaotalk' ? ' 아래 방법으로 Safari에서 열어주세요.' : ' Safari에서 다시 열어주세요.'}
          </p>

          {/* 카카오톡 전용 안내 */}
          {iosBrowser === 'kakaotalk' && (
            <div className="space-y-2.5 mb-4">
              <Step num={1}>
                오른쪽 하단 <B>⋯ 버튼</B>을 누르세요
              </Step>
              <Step num={2}>
                <B>&quot;다른 브라우저로 열기&quot;</B>를 누르면 Safari가 열려요
              </Step>
            </div>
          )}

          {/* 그 외 브라우저 — URL 복사 방식 */}
          {iosBrowser !== 'kakaotalk' && (
            <div className="space-y-3 mb-4">
              <Step num={1}>아래 버튼을 눌러 <B>주소를 복사</B>하세요</Step>
              <Step num={2}><B>Safari</B>를 열고 주소창에 <B>붙여넣기</B> 하세요</Step>
            </div>
          )}

          {/* URL 복사 버튼 */}
          <button
            onClick={handleCopyUrl}
            className={`w-full py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-accent-green/15 border border-accent-green/30 text-accent-green'
                : 'bg-accent-gold text-bg-deep'
            }`}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                복사 완료! Safari에서 붙여넣기 하세요
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {iosBrowser === 'kakaotalk' ? 'Safari용 주소 복사하기' : '주소 복사해서 Safari에서 열기'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Safari이거나 Android인 경우 — 아이콘 선택 + 설치 안내 */}
      {!needsSafari && (
        <>
          {/* 아이콘 선택 */}
          <div className="px-5 py-4 border-t border-border-subtle">
            <div className="text-[13px] font-bold text-accent-gold tracking-[1px] mb-3">
              바탕화면 아이콘을 골라주세요
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

          {/* 설치 안내 */}
          <div className="px-5 py-4 border-t border-border-subtle">
            {/* Android 자동 설치 */}
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
                          하단의 <InlineIcon type="share" /> <B>공유 버튼</B>을 누르세요
                        </Step>
                        <Step num={2}>
                          아래로 스크롤해서 <B>&quot;홈 화면에 추가&quot;</B>를 선택
                        </Step>
                        <Step num={3}>
                          오른쪽 상단 <B>&quot;추가&quot;</B>를 누르면 완료!
                        </Step>
                      </>
                    ) : platform === 'android' ? (
                      <>
                        <Step num={1}>
                          오른쪽 상단 <InlineIcon type="menu" /> <B>메뉴(⋮)</B>를 누르세요
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
                        <Step num={1}>브라우저 메뉴를 열어주세요</Step>
                        <Step num={2}><B>&quot;홈 화면에 추가&quot;</B> 또는 <B>&quot;앱 설치&quot;</B>를 선택하세요</Step>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
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
