import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * 사용자가 선택한 아이콘으로 동적 매니페스트 생성
 * 쿠키에서 선택된 아이콘 번호를 읽어서 해당 아이콘을 매니페스트에 넣음
 */
export async function GET() {
  const cookieStore = await cookies();
  const iconNum = cookieStore.get('dalsaegim-icon')?.value || '3';

  const manifest = {
    name: '달새김 — 소중한 날을 달에 새기다',
    short_name: '달새김',
    description: '음력/양력 기념일을 자동으로 관리하고 미리 알려주는 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d14',
    theme_color: '#0a0d14',
    orientation: 'portrait',
    icons: [
      {
        src: `/icons/app-icon-${iconNum}.png`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `/icons/app-icon-${iconNum}.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `/icons/app-icon-${iconNum}.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
