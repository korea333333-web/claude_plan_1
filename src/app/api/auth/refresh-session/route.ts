import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * 카카오 로그인 사용자의 Supabase 세션이 만료됐을 때
 * 카카오 세션 쿠키 기반으로 Supabase에 로그인하고
 * access_token + refresh_token을 클라이언트에 직접 내려줌
 * → 클라이언트가 supabase.auth.setSession()으로 세션 복구
 */
export async function POST() {
  const cookieStore = await cookies();

  // 1) 카카오 세션 쿠키 확인
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'No kakao session' }, { status: 401 });
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ error: 'Invalid kakao session' }, { status: 401 });
  }

  // 2) 카카오 ID로 Supabase 이메일/비밀번호 도출
  const email = `kakao_${session.kakaoId}@dalsaegim.app`;
  const password = crypto
    .createHmac('sha256', process.env.KAKAO_SESSION_SECRET!)
    .update(`kakao_${session.kakaoId}`)
    .digest('hex');

  // 3) 일반 Supabase 클라이언트로 로그인 (쿠키 불필요, 토큰만 받으면 됨)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let result = await supabase.auth.signInWithPassword({ email, password });

  // 로그인 실패 → 유저 생성 후 재시도
  if (result.error && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: session.nickname,
          avatar_url: session.profileImage,
          provider: 'kakao',
          kakao_id: session.kakaoId,
        },
      });

      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (err) {
      console.error('[refresh-session] user create failed:', err);
    }
  }

  if (result.error || !result.data.session) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }

  // 4) 세션 토큰을 클라이언트에 직접 전달
  return NextResponse.json({
    success: true,
    userId: result.data.user!.id,
    access_token: result.data.session.access_token,
    refresh_token: result.data.session.refresh_token,
  });
}
