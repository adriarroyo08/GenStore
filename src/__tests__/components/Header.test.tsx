import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es', setLanguage: vi.fn() }),
}));

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'EUR',
    formatPrice: (p: number) => `€${p}`,
    convertPrice: (p: number) => p,
    setCurrency: vi.fn(),
  }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

// Mock child components that pull in complex dependencies
vi.mock('../../components/SearchDropdown', () => ({
  SearchDropdown: () => <div data-testid="search-dropdown" />,
}));

vi.mock('../../components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/GenStoreLogo', () => ({
  GenStoreLogo: ({ size }: any) => <div data-testid="genstore-logo" data-size={size} />,
}));

vi.mock('../../components/Notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('../../components/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />,
}));

vi.mock('../../components/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

vi.mock('../../components/CurrencySelector', () => ({
  CurrencySelector: () => <div data-testid="currency-selector" />,
}));

import { Header } from '../../components/Header';

const defaultProps = {
  searchQuery: '',
  setSearchQuery: vi.fn(),
  cartItemsCount: 0,
  cart: [],
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  cartTotal: 0,
  user: null,
  wishlist: [],
  onLoginClick: vi.fn(),
  onLogout: vi.fn(),
  onHomeClick: vi.fn(),
  onCartClick: vi.fn(),
  onCheckoutClick: vi.fn(),
  onAccountClick: vi.fn(),
  onCatalogClick: vi.fn(),
  onWishlistClick: vi.fn(),
  onSettingsClick: vi.fn(),
  onOrdersClick: vi.fn(),
  products: [],
  onProductSelect: vi.fn(),
  onSearch: vi.fn(),
};

function renderHeader(overrides: Partial<typeof defaultProps> = {}) {
  return render(<Header {...defaultProps} {...overrides} />);
}

describe('Header', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the GenStore logo', () => {
    renderHeader();
    expect(screen.getByTestId('genstore-logo')).toBeInTheDocument();
  });

  it('renders GenStore brand text', () => {
    renderHeader();
    expect(screen.getByText('GenStore')).toBeInTheDocument();
  });

  it('shows login button (UserIcon) when user is not logged in', () => {
    renderHeader({ user: null });
    const loginBtn = screen.getByRole('button', { name: 'Mi cuenta' });
    expect(loginBtn).toBeInTheDocument();
  });

  it('calls onLoginClick when login button is clicked', () => {
    const onLoginClick = vi.fn();
    renderHeader({ user: null, onLoginClick });
    fireEvent.click(screen.getByRole('button', { name: 'Mi cuenta' }));
    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });

  it('shows user avatar when logged in', () => {
    const user = { id: 'u1', email: 'ana@example.com', name: 'Ana', access_token: 'tok' };
    renderHeader({ user });
    // Avatar button shows first letter of name/email
    const avatarBtn = screen.getByRole('button', { name: 'Mi cuenta' });
    expect(avatarBtn).toBeInTheDocument();
    expect(avatarBtn.querySelector('div')).toBeInTheDocument(); // blue circle div
  });

  it('shows cart badge when cartItemsCount > 0', () => {
    renderHeader({ cartItemsCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show cart badge when cartItemsCount is 0', () => {
    renderHeader({ cartItemsCount: 0 });
    // Badge span only rendered when count > 0
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows 99+ when cartItemsCount exceeds 99', () => {
    renderHeader({ cartItemsCount: 150 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls onCartClick when cart button is clicked', () => {
    const onCartClick = vi.fn();
    renderHeader({ cartItemsCount: 2, onCartClick });
    fireEvent.click(screen.getByRole('button', { name: /carrito de compras/i }));
    expect(onCartClick).toHaveBeenCalledTimes(1);
  });

  it('calls onHomeClick when logo button is clicked', () => {
    const onHomeClick = vi.fn();
    renderHeader({ onHomeClick });
    // The logo button is the first button in the header
    const logoBtn = screen.getAllByRole('button').find(b => b.querySelector('[data-testid="genstore-logo"]'));
    expect(logoBtn).toBeDefined();
    fireEvent.click(logoBtn!);
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });

  it('shows notification bell when user is logged in', () => {
    const user = { id: 'u1', email: 'test@example.com', name: 'Test', access_token: 'tok' };
    renderHeader({ user });
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('does not show notification bell when user is logged out', () => {
    renderHeader({ user: null });
    expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
  });

  it('renders search dropdown', () => {
    renderHeader();
    expect(screen.getAllByTestId('search-dropdown').length).toBeGreaterThan(0);
  });

  it('shows wishlist badge when wishlist has items', () => {
    const user = { id: 'u1', email: 'test@example.com', name: 'Test', access_token: 'tok' };
    renderHeader({ user, wishlist: ['prod-1', 'prod-2', 'prod-3'] });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
