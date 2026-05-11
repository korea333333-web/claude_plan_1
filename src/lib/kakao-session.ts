import crypto from 'crypto';

export const COOKIE_NAME = 'dalsaegim_kakao_session';

export interface KakaoSessionData {
  kakaoId: string;
  nickname: string;
  profileImage: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.KAKAO_SESSION_SECRET;
  if (!secret) throw new Error('KAKAO_SESSION_SECRET is not set');
  return secret;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
}

export function createSessionValue(data: Omit<KakaoSessionData, 'iat' | 'exp'>): string {
  const payload: KakaoSessionData = {
    ...data,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySession(cookieValue: string): KakaoSessionData | null {
  try {
    const [encoded, signature] = cookieValue.split('.');
    if (!encoded || !signature) return null;

    const expectedSig = sign(encoded);
    if (signature !== expectedSig) return null;

    const data: KakaoSessionData = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    );
    if (data.exp < Date.now()) return null;

    return data;
  } catch {
    return null;
  }
}
