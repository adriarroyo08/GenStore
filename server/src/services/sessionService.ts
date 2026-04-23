import { supabaseAdmin } from '../config/supabase.js';

interface DeviceInfo {
  browser: string;
  os: string;
  device_type: string;
}

function parseUserAgent(ua: string | undefined): DeviceInfo {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device_type: 'desktop' };

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  // OS detection
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device type
  let device_type = 'desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device_type = 'mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) device_type = 'tablet';

  return { browser, os, device_type };
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays}d`;
}

/** Upsert a session entry when a user makes an authenticated request */
export async function trackSession(userId: string, token: string, userAgent: string | undefined, ip: string) {
  const device = parseUserAgent(userAgent);

  // Use a hash of token prefix + UA as a stable session identifier
  const sessionKey = `${token.substring(0, 16)}_${(userAgent || '').substring(0, 40)}`;

  // Try to find existing session for this device/token combo
  const { data: existing } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('supabase_session_id', sessionKey)
    .maybeSingle();

  if (existing) {
    // Update last_active
    await supabaseAdmin
      .from('user_sessions')
      .update({ last_active: new Date().toISOString(), ip_address: ip })
      .eq('id', existing.id);
  } else {
    // Insert new session
    await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        supabase_session_id: sessionKey,
        device_browser: device.browser,
        device_os: device.os,
        device_type: device.device_type,
        ip_address: ip,
        user_agent: userAgent?.substring(0, 500),
      });
  }
}

/** Get all sessions for a user */
export async function getUserSessions(userId: string, currentToken: string, currentUA: string | undefined) {
  const { data, error } = await supabaseAdmin
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_active', { ascending: false });

  if (error) throw new Error(error.message);

  const currentKey = `${currentToken.substring(0, 16)}_${(currentUA || '').substring(0, 40)}`;

  return (data ?? []).map((s: any) => ({
    id: s.id,
    device_info: {
      browser: s.device_browser,
      os: s.device_os,
      device_type: s.device_type,
    },
    ip_address: s.ip_address,
    location: '',
    last_active: s.last_active,
    last_active_relative: relativeTime(new Date(s.last_active)),
    is_current: s.supabase_session_id === currentKey,
    created_at: s.created_at,
  }));
}

/** Delete a specific session */
export async function revokeSession(sessionId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

/** Delete all sessions except the current one */
export async function revokeAllOtherSessions(userId: string, currentToken: string, currentUA: string | undefined) {
  const currentKey = `${currentToken.substring(0, 16)}_${(currentUA || '').substring(0, 40)}`;

  const { error } = await supabaseAdmin
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('supabase_session_id', currentKey);

  if (error) throw new Error(error.message);
}

/** Clean up stale sessions older than 30 days */
export async function cleanupStaleSessions() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('user_sessions')
    .delete()
    .lt('last_active', cutoff);
}
