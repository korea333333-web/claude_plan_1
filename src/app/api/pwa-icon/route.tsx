import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') || '512');
  const s = Math.min(Math.max(size, 48), 1024);

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0f1219, #161b26)',
          borderRadius: s * 0.22,
        }}
      >
        {/* 달 모양 */}
        <div
          style={{
            width: s * 0.52,
            height: s * 0.52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9a96e, #e8d5a3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `0 0 ${s * 0.15}px rgba(201,169,110,0.4)`,
          }}
        >
          {/* 초승달 효과 */}
          <div
            style={{
              position: 'absolute',
              width: s * 0.42,
              height: s * 0.42,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #0f1219, #161b26)',
              top: s * 0.01,
              left: s * 0.13,
            }}
          />
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}
