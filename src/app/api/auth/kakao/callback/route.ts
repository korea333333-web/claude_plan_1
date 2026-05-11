import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSessionValue, COOKIE_NAME } from '@/lib/kakao-session';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_denied`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('kakao_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=kakao_state_mismatch`);
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;

  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('[kakao-auth] token exchange failed:', tokenData);
    return NextResponse.redirect(`${origin}/login?error=kakao_token_failed`);
  }

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const kakaoUser = await userRes.json();
  const kakaoId = kakaoUser.id;
  const nickname =
    kakaoUser.properties?.nickname ||
    kakaoUser.kakao_account?.profile?.nickname ||
    '사용자';
  const profileImage =
    kakaoUser.properties?.profile_image ||
    kakaoUser.kakao_account?.profile?.profile_image_url ||
    '';

  if (!kakaoId) {
    return NextResponse.redirect(`${origin}/login?error=kakao_user_failed`);
  }

  const sessionValue = createSessionValue({
    kakaoId: String(kakaoId),
    nickname,
    profileImage,
  });

  const response = NextResponse.redirect(`${origin}/`);

  response.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  response.cookies.set('kakao_oauth_state', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  // Supabase 사용자 생성 + 세션 설정 (데이터 저장을 위해 필요)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const email = `kakao_${kakaoId}@dalsaegim.app`;
      const password = crypto
        .createHmac('sha256', process.env.KAKAO_SESSION_SECRET!)
        .update(`kakao_${kakaoId}`)
        .digest('hex');

      const supabaseServer = createServerClient(
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

      const { error: signInError } = await supabaseServer.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.log('[kakao-auth] signIn failed, creating user:', signInError.message);
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: nickname,
            avatar_url: profileImage,
            provider: 'kakao',
            kakao_id: String(kakaoId),
          },
        });

        if (createError) {
          console.error('[kakao-auth] createUser failed:', JSON.stringify(createError));
        } else {
          const { error: signInError2 } = await supabaseServer.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError2) {
            console.error('[kakao-auth] signIn after create failed:', signInError2.message);
          }
        }
      }
    } catch (err) {
      console.error('[kakao-auth] Supabase user creation failed:', err);
    }
  }

  return response;
}
