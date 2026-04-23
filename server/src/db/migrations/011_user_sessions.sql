-- 011_user_sessions.sql
-- Track user sessions with device/IP info (supplements Supabase auth.sessions)

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supabase_session_id TEXT,          -- maps to auth.sessions.id if available
  device_browser TEXT NOT NULL DEFAULT 'Unknown',
  device_os TEXT NOT NULL DEFAULT 'Unknown',
  device_type TEXT NOT NULL DEFAULT 'desktop',  -- desktop, mobile, tablet
  ip_address TEXT NOT NULL DEFAULT '0.0.0.0',
  user_agent TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON user_sessions(last_active);
