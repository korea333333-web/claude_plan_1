import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/kakao-session';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return NextResponse.json({ user: null });
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      kakaoId: session.kakaoId,
      nickname: session.nickname,
      profileImage: session.profileImage,
    },
  });
}
