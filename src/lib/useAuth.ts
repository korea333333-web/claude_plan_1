'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';

interface AuthState {
  userId: string | null;
  name: string;
  provider: 'google' | 'kakao' | null;
  avatarUrl?: string;
  email: string;
  loading: boolean;
}

/**
 * 카카오/구글 로그인 공통 인증 훅
 *
 * 1) supabase.auth.getUser() 시도
 * 2) 실패하면 카카오 세션 확인
 * 3) 카카오 세션 있으면 /api/auth/refresh-session 호출해서 Supabase 세션 복구
 * 4) 복구 후 다시 supabase.auth.getUser()로 userId 확보
 *
 * 이렇게 하면 카카오 재로그인해도 같은 userId로 데이터 접근 가능
 */
export function useAuth() {
  const supabase = createClient();
  const [auth, setAuth] = useState<AuthState>({
    userId: null,
    name: '',
    provider: null,
    avatarUrl: undefined,
    email: '',
    loading: true,
  });
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current) return;
    resolved.current = true;

    (async () => {
      // 1단계: Supabase 직접 인증 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const prov = user.user_metadata?.provider || user.app_metadata?.provider;
        setAuth({
          userId: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
          provider: prov === 'kakao' ? 'kakao' : 'google',
          avatarUrl: user.user_metadata?.avatar_url,
          email: user.email || '',
          loading: false,
        });
        return;
      }

      // 2단계: 카카오 세션 확인
      try {
        const res = await fetch('/api/auth/kakao/session');
        const data = await res.json();
        if (!data.user) {
          // 로그인 안 된 상태
          setAuth(prev => ({ ...prev, loading: false }));
          return;
        }

        // 카카오 세션은 있음 → 이름/프로필 먼저 세팅
        const kakaoName = data.user.nickname || '사용자';
        const kakaoAvatar = data.user.profileImage;

        // 3단계: Supabase 세션 복구
        try {
          const refreshRes = await fetch('/api/auth/refresh-session', { method: 'POST' });
          const refreshData = await refreshRes.json();

          if (refreshData.success && refreshData.userId) {
            // 복구 성공! 클라이언트 세션도 갱신
            await supabase.auth.getSession();

            setAuth({
              userId: refreshData.userId,
              name: kakaoName,
              provider: 'kakao',
              avatarUrl: kakaoAvatar,
              email: '',
              loading: false,
            });
            return;
          }
        } catch {
          console.error('[useAuth] refresh-session failed');
        }

        // Supabase 복구 실패했지만 카카오 세션은 있음
        setAuth({
          userId: null,
          name: kakaoName,
          provider: 'kakao',
          avatarUrl: kakaoAvatar,
          email: '',
          loading: false,
        });
      } catch {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  return auth;
}
