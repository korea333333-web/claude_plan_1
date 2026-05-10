'use client';

import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async (provider: 'kakao' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden bg-bg-deep">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-accent-gold/[0.06] blur-[100px]" />
        <div className="absolute top-[50%] left-[70%] w-[200px] h-[200px] rounded-full bg-accent-lunar/[0.04] blur-[80px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-9 relative z-10">
        {/* Moon */}
        <div
          className="w-20 h-20 rounded-full mb-10"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #f0ece4 0%, #c9a96e 40%, rgba(201,169,110,0.3) 70%, transparent 100%)',
            boxShadow: '0 0 60px rgba(201, 169, 110, 0.15), 0 0 120px rgba(201, 169, 110, 0.05)',
          }}
        />

        <h1 className="text-3xl font-light tracking-tight mb-2">
          <span className="text-accent-gold font-medium">달</span>새김
        </h1>
        <p className="text-text-secondary text-[15px] leading-relaxed mb-14">
          소중한 날을 달에 새기다
          <br />
          음력 기념일, 이제 놓치지 마세요
        </p>

        <button
          onClick={() => handleLogin('kakao')}
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-[14px] text-[15px] font-medium mb-3 cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: '#FEE500', color: '#191919' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 3C5.58 3 2 5.87 2 9.35c0 2.2 1.45 4.13 3.63 5.25-.16.58-.58 2.1-.67 2.43-.1.4.15.4.31.29.13-.08 2.03-1.38 2.85-1.95.61.09 1.24.13 1.88.13 4.42 0 8-2.87 8-6.35S14.42 3 10 3z" fill="#191919" />
          </svg>
          카카오로 시작하기
        </button>

        <button
          onClick={() => handleLogin('google')}
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-[14px] text-[15px] font-medium cursor-pointer bg-bg-card border border-border-card text-text-primary transition-opacity hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Google로 시작하기
        </button>
      </div>

      <p className="text-center text-[11px] text-text-tertiary pb-12 relative z-10">
        로그인 시 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  );
}
