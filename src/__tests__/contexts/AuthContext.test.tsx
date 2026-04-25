import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../contexts/AuthContext';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn((cb: any) => {
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockRejectedValue(new Error('not authenticated')),
    post: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts in loading state then resolves to unauthenticated', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuthContext must be used within AuthProvider');
    consoleSpy.mockRestore();
  });
});
