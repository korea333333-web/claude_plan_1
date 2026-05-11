import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { verifySession, COOKIE_NAME } from './kakao-session';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // Server Component에서는 쿠키 설정 불가 — 무시
          }
        },
      },
    }
  );
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  const cookieStore = await cookies();
  const kakaoSessionCookie = cookieStore.get(COOKIE_NAME);
  if (!kakaoSessionCookie?.value) {
    return null;
  }

  const session = verifySession(kakaoSessionCookie.value);
  if (!session) {
    return null;
  }

  const secret = process.env.KAKAO_SESSION_SECRET;
  if (!secret) {
    return null;
  }

  const service = createServiceClient();
  const email = `kakao_${session.kakaoId}@dalsaegim.app`;
  const password = crypto
    .createHmac('sha256', secret)
    .update(`kakao_${session.kakaoId}`)
    .digest('hex');

  const { data: listData, error: listErr } = await service.auth.admin.listUsers();
  if (listErr) return null;
  const existing = listData?.users?.find(u => u.email === email);
  if (existing) {
    return existing.id;
  }
  const { data: created, error: createErr } = await service.auth.admin.createUser({
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

  if (createErr || !created?.user) {
    return null;
  }

  return created.user.id;
}
