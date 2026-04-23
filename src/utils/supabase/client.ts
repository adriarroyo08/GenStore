import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Production flag for logging control
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Safe logger that only logs in development
const safeLog = {
  info: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but sanitize sensitive data in production
    if (IS_PRODUCTION) {
      const sanitizedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return '[Sanitized Object]';
        }
        if (typeof arg === 'string' && (arg.includes('token') || arg.includes('auth') || arg.includes('@'))) {
          return '[Sanitized String]';
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    } else {
      console.error(...args);
    }
  }
};

// Create a single Supabase client instance that will be shared across the app
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? {
      getItem: (key: string) => {
        const value = window.localStorage.getItem(key);
        // Additional validation for auth data
        if (value && key.includes('auth-token')) {
          try {
            const parsed = JSON.parse(value);
            // Check if token is expired
            if (parsed.expires_at) {
              const expiresAt = new Date(parsed.expires_at * 1000);
              const now = new Date();
              
              if (expiresAt <= now) {
                safeLog.info('Retrieved expired token, removing');
                window.localStorage.removeItem(key);
                return null;
              }
            }
          } catch (error) {
            safeLog.warn('Invalid auth data format, removing');
            window.localStorage.removeItem(key);
            return null;
          }
        }
        return value;
      },
      setItem: (key: string, value: string) => {
        // Log when auth data is being stored (development only)
        if (key.includes('auth-token')) {
          safeLog.info('Storing auth token');
        }
        window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
      }
    } : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'genstore-app',
    }
  }
});

// Export the singleton instance as default and named export
export default supabase;

// Helper function to get current user with validation
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      safeLog.error('Error getting current user');
      // If there's an auth error, clean up any stale session data
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        safeLog.info('JWT/token error detected, cleaning up stale session');
        await supabase.auth.signOut({ scope: 'local' });
      }
      return null;
    }
    
    // Additional validation for user object
    if (user && (!user.id || !user.email)) {
      safeLog.warn('Invalid user data structure');
      return null;
    }
    
    return user;
  } catch (error) {
    safeLog.error('Error in getCurrentUser');
    // Clean up on any unexpected error
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (cleanupError) {
      safeLog.error('Error during cleanup');
    }
    return null;
  }
};

// Helper function to get current session with validation
export const getCurrentSession = async () => {
  try {
    safeLog.info('Getting current session');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!IS_PRODUCTION) {
      // Only show detailed session info in development
      console.log('Session response:', {
        hasSession: !!session,
        hasError: !!error,
        errorMessage: error?.message,
        sessionDetails: session ? {
          hasUser: !!session.user,
          hasAccessToken: !!session.access_token,
          userEmail: session.user?.email,
          expiresAt: session.expires_at,
          tokenType: session.token_type
        } : null
      });
    }
    
    if (error) {
      safeLog.error('Error getting current session');
      return null;
    }
    
    // Validate session if it exists
    if (session) {
      safeLog.info('Validating session');
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      
      if (!IS_PRODUCTION) {
        console.log('Time check:', {
          now: now,
          expiresAt: session.expires_at,
          expired: session.expires_at ? session.expires_at <= now : false
        });
      }
      
      if (session.expires_at && session.expires_at <= now) {
        safeLog.info('Session is expired, cleaning up');
        await supabase.auth.signOut({ scope: 'local' });
        return null;
      }
      
      // Check if access token exists and is valid
      if (!session.access_token || !session.user) {
        safeLog.warn('Invalid session data structure');
        return null;
      }
      
      safeLog.info('Valid session found');
    } else {
      safeLog.info('No session found');
    }
    
    return session;
  } catch (error) {
    safeLog.error('Unexpected error in getCurrentSession');
    return null;
  }
};

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      safeLog.error('Error signing out');
      throw error;
    }
  } catch (error) {
    safeLog.error('Error in signOut');
    throw error;
  }
};