import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardsPage } from '../../components/RewardsPage';

// --- Mocks ---

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatPrice: (p: number) => `€${p.toFixed(2)}`,
    convertPrice: (p: number) => p,
    currency: 'EUR',
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn().mockReturnValue({
    user: { id: 'u1', email: 'test@test.com', name: 'Test' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockRedeemReward = vi.fn().mockResolvedValue(true);
const mockFetchUserPoints = vi.fn().mockResolvedValue(undefined);

vi.mock('../../hooks/usePoints', () => ({
  usePoints: () => ({
    userPoints: {
      currentPoints: 1250,
      lifetimeEarned: 2000,
      lifetimeRedeemed: 750,
      tier: 'silver',
    },
    pointsHistory: [
      {
        id: 'tx1',
        type: 'earned',
        amount: 50,
        description: 'Compra completada',
        createdAt: '2026-01-10T12:00:00Z',
      },
    ],
    availableRewards: [
      {
        id: 'r1',
        name: 'Descuento 5€',
        description: '5€ de descuento en tu próxima compra',
        pointsCost: 500,
        category: 'discount',
        value: 5,
        isActive: true,
      },
      {
        id: 'r2',
        name: 'Envío gratis',
        description: 'Envío gratuito en tu próximo pedido',
        pointsCost: 300,
        category: 'shipping',
        value: 10,
        isActive: true,
      },
    ],
    isLoading: false,
    isEnabled: true,
    error: null,
    calculatePointsFromAmount: (amount: number) => Math.floor(amount),
    redeemReward: mockRedeemReward,
    fetchUserPoints: mockFetchUserPoints,
  }),
}));

// Mock AccountLayout to render children directly
vi.mock('../../components/AccountLayout', () => ({
  AccountLayout: ({ children, pageTitle, pageDescription }: any) => (
    <div data-testid="account-layout">
      {pageTitle && <h1>{pageTitle}</h1>}
      {pageDescription && <p>{pageDescription}</p>}
      {children}
    </div>
  ),
}));

vi.mock('../../components/figma/ImageWithFallback', () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// --- Default props ---

const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test User' };

const defaultProps = {
  user: mockUser,
  onBackToAccount: vi.fn(),
  onProfileClick: vi.fn(),
  onOrdersClick: vi.fn(),
  onAddressesClick: vi.fn(),
  onPaymentMethodsClick: vi.fn(),
  onWishlistClick: vi.fn(),
  onRewardsClick: vi.fn(),
  onSettingsClick: vi.fn(),
  onAdminClick: vi.fn(),
  onLogout: vi.fn(),
  onLoginClick: vi.fn(),
};

describe('RewardsPage', () => {
  it('renders the page title', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('rewardsTitle')).toBeInTheDocument();
  });

  it('renders the current points balance', () => {
    render(<RewardsPage {...defaultProps} />);
    // 1250 formatted with toLocaleString
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('renders the "currentPoints" label', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('currentPoints')).toBeInTheDocument();
  });

  it('renders the tier badge (silver)', () => {
    render(<RewardsPage {...defaultProps} />);
    // getTierBenefits('silver').name => t('tierSilver') => 'tierSilver'
    expect(screen.getByText('tierSilver')).toBeInTheDocument();
  });

  it('renders lifetime earned and redeemed stats', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('lifetimeEarned')).toBeInTheDocument();
    expect(screen.getByText('lifetimeRedeemed')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
  });

  it('renders available reward card names', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('Descuento 5€')).toBeInTheDocument();
    expect(screen.getByText('Envío gratis')).toBeInTheDocument();
  });

  it('renders the points cost for each reward using partial text match', () => {
    render(<RewardsPage {...defaultProps} />);
    // The reward points cost is rendered as "{cost.toLocaleString()} rewardPoints"
    // The span contains just "500" but may be split across elements
    // Use a flexible text matcher
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/300/)).toBeInTheDocument();
  });

  it('renders reward descriptions', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('5€ de descuento en tu próxima compra')).toBeInTheDocument();
    expect(screen.getByText('Envío gratuito en tu próximo pedido')).toBeInTheDocument();
  });

  it('renders a history toggle button', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('viewHistory')).toBeInTheDocument();
  });

  it('shows points history when toggle is clicked', () => {
    render(<RewardsPage {...defaultProps} />);
    const historyToggle = screen.getByText('viewHistory');
    fireEvent.click(historyToggle);
    // Now shows 'hideHistory'
    expect(screen.getByText('hideHistory')).toBeInTheDocument();
    // History entry appears
    expect(screen.getByText('Compra completada')).toBeInTheDocument();
  });

  it('does not show "Sistema de puntos no disponible" when system is enabled', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.queryByText('Sistema de puntos no disponible')).not.toBeInTheDocument();
  });

  it('renders the rewards catalog heading', () => {
    render(<RewardsPage {...defaultProps} />);
    expect(screen.getByText('rewardsCatalog')).toBeInTheDocument();
  });
});
