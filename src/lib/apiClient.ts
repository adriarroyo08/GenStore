import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Keep access token in memory, updated by auth state changes
let _accessToken: string | null = null;

// Listen for auth state changes and cache the token
supabase.auth.onAuthStateChange((_event, session) => {
  _accessToken = session?.access_token ?? null;
});

// Also initialize from current session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.access_token) {
    _accessToken = session.access_token;
  }
});

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Use cached token first (most reliable — set by onAuthStateChange)
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
    return headers;
  }

  // Fallback: try getSession (reads from localStorage)
  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { data } = await supabase.auth.refreshSession();
      session = data.session;
    }
    if (session?.access_token) {
      _accessToken = session.access_token;
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('[apiClient] Error getting auth headers:', err);
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Error desconocido' }));
    const serverError = body.error ?? `Error ${response.status}`;
    if (response.status === 401) {
      console.error('[apiClient] 401 response:', serverError);
      throw new Error(serverError);
    }
    throw new Error(serverError);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const apiClient = {
  async get<T = unknown>(path: string): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    return handleResponse<T>(res);
  },

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T = unknown>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  async delete<T = unknown>(path: string): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse<T>(res);
  },
};
