import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function derivePassword(kakaoId: string | number): string {
  return crypto
    .createHmac('sha256', process.env.KAKAO_CLIENT_SECRET!)
    .update(String(kakaoId))
    .digest('hex');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_denied`);
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;

  // 1. Exchange code for Kakao access token
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
    console.error('[kakao-auth] token exchange failed:', JSON.stringify(tokenData));
    console.error('[kakao-auth] redirect_uri used:', redirectUri);
    return NextResponse.redirect(`${origin}/login?error=kakao_token_failed`);
  }

  // 2. Get user info from Kakao
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

  const email = `kakao_${kakaoId}@kakao.dalsaegim`;
  const password = derivePassword(kakaoId);

  // 3. Admin client for user creation
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 4. Server client for session management (sets cookies)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore in Server Component context
          }
        },
      },
    }
  );

  const metadata = {
    full_name: nickname,
    name: nickname,
    avatar_url: profileImage,
    provider: 'kakao',
    kakao_id: String(kakaoId),
  };

  // 5. Try to sign in (user might already exist)
  let { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    // User doesn't exist — create with admin API
    const { error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createError) {
      console.error('[kakao-auth] user creation failed:', createError.message);
      return NextResponse.redirect(`${origin}/login?error=create_failed`);
    }

    // Sign in after creation
    const result = await supabase.auth.signInWithPassword({ email, password });
    signInData = result.data;
    signInError = result.error;
  }

  if (signInError || !signInData.session) {
    return NextResponse.redirect(`${origin}/login?error=signin_failed`);
  }

  // 6. Update user metadata with latest Kakao info
  await adminSupabase.auth.admin.updateUserById(signInData.user.id, {
    user_metadata: metadata,
  });

  return NextResponse.redirect(`${origin}/`);
}
