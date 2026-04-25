import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from '../../components/LoginPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn().mockReturnValue({
    user: null, isAuthenticated: false, isLoading: false,
    login: vi.fn(), signup: vi.fn(), logout: vi.fn(),
  }),
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }) } },
}));

// LoginPage uses useAuth from hooks/useAuth which re-exports useAuthContext
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null, isAuthenticated: false, isLoading: false,
    login: vi.fn(), signup: vi.fn(), logout: vi.fn(),
  }),
}));

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({}),
  },
}));

// GenStoreLogo may try to use complex imports — stub it
vi.mock('../../components/GenStoreLogo', () => ({
  GenStoreLogo: () => <div data-testid="genstore-logo" />,
}));

function renderLoginPage(overrides: Partial<Parameters<typeof LoginPage>[0]> = {}) {
  const defaults = {
    onBackToHome: vi.fn(),
    onLoginSuccess: vi.fn(),
    onShowSignup: vi.fn(),
  };
  return { ...render(<LoginPage {...defaults} {...overrides} />), ...defaults, ...overrides };
}

describe('LoginPage', () => {
  it('renders login form with email and password inputs', () => {
    renderLoginPage();
    expect(screen.getByLabelText('auth.emailOrUsername')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@ejemplo.com')).toBeInTheDocument();
  });

  it('calls onBackToHome when back button is clicked', () => {
    const onBackToHome = vi.fn();
    renderLoginPage({ onBackToHome });
    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });

  it('calls onShowSignup when signup link is clicked', () => {
    const onShowSignup = vi.fn();
    renderLoginPage({ onShowSignup });
    fireEvent.click(screen.getByRole('button', { name: 'auth.signupLink' }));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility when eye button is clicked', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText('auth.password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: 'Mostrar contraseña' });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
