import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, createServiceClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://claude-plan-1.vercel.app';

  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const storedState = req.cookies.get('gcal_oauth_state')?.value;

    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/gcal/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
    }

    const tokens = await tokenRes.json();

    // Get Google email
    let gcalEmail = '';
    if (tokens.access_token) {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userRes.ok) {
        const profile = await userRes.json();
        gcalEmail = profile.email || '';
      }
    }

    // Save to DB
    const service = createServiceClient();
    const { data: row } = await service
      .from('notification_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (row) {
      const { error } = await service
        .from('notification_settings')
        .update({
          gcal_refresh_token: tokens.refresh_token || null,
          gcal_access_token: tokens.access_token || null,
          gcal_token_expiry: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          gcal_email: gcalEmail,
          gcal_connected_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
      }
    } else {
      const { error } = await service
        .from('notification_settings')
        .insert({
          user_id: userId,
          gcal_refresh_token: tokens.refresh_token || null,
          gcal_access_token: tokens.access_token || null,
          gcal_token_expiry: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          gcal_email: gcalEmail,
          gcal_connected_at: new Date().toISOString(),
        });

      if (error) {
        return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
      }
    }

    const response = NextResponse.redirect(`${baseUrl}/settings?gcal=success`);
    response.cookies.delete('gcal_oauth_state');
    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?gcal=error`);
  }
}
