import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * 카카오 로그인 사용자의 Supabase 세션이 만료됐을 때
 * 카카오 세션 쿠키를 기반으로 Supabase 세션을 다시 설정해준다.
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

  // 2) 카카오 ID로 Supabase 이메일/비밀번호 도출 (callback과 동일한 로직)
  const email = `kakao_${session.kakaoId}@dalsaegim.app`;
  const password = crypto
    .createHmac('sha256', process.env.KAKAO_SESSION_SECRET!)
    .update(`kakao_${session.kakaoId}`)
    .digest('hex');

  const response = NextResponse.json({ success: true });

  // 3) Supabase 서버 클라이언트로 로그인 → 쿠키에 세션 저장
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    // 유저가 아직 없으면 생성 시도
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

        // 생성 후 다시 로그인
        const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error2 || !data2.user) {
          return NextResponse.json({ error: 'Auth failed after create' }, { status: 401 });
        }

        return NextResponse.json({ success: true, userId: data2.user.id });
      } catch (err) {
        console.error('[refresh-session] user create failed:', err);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }

  // response에 이미 쿠키가 설정됨
  return NextResponse.json({ success: true, userId: data.user.id });
}
