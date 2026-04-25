import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OrdersPage } from '../../components/OrdersPage';

// --- Mocks ---

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, isDarkMode: false }),
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

const mockApiGet = vi.fn();

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: (...args: any[]) => mockApiGet(...args),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../hooks/usePoints', () => ({
  usePoints: () => ({
    userPoints: null,
    pointsHistory: [],
    availableRewards: [],
    isLoading: false,
    isEnabled: true,
    error: null,
    calculatePointsFromAmount: (amount: number) => Math.floor(amount),
    redeemReward: vi.fn(),
    fetchUserPoints: vi.fn(),
  }),
}));

vi.mock('../../components/AccountSidebar', () => ({
  AccountSidebar: () => <nav data-testid="account-sidebar" />,
}));

// --- Default props ---

const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test User' };

const defaultProps = {
  user: mockUser,
  searchQuery: '',
  setSearchQuery: vi.fn(),
  cartItemsCount: 0,
  cart: [],
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  cartTotal: 0,
  onLoginClick: vi.fn(),
  onLogout: vi.fn(),
  products: [],
  onProductSelect: vi.fn(),
  onSearch: vi.fn(),
  wishlist: [],
  onToggleWishlist: vi.fn(),
  onBackToAccount: vi.fn(),
  onProfileClick: vi.fn(),
  onOrdersClick: vi.fn(),
  onAddressesClick: vi.fn(),
  onPaymentMethodsClick: vi.fn(),
  onWishlistClick: vi.fn(),
  onRewardsClick: vi.fn(),
  onSettingsClick: vi.fn(),
  onCartClick: vi.fn(),
  onCatalogClick: vi.fn(),
  onTrackOrder: vi.fn(),
};

describe('OrdersPage', () => {
  beforeEach(() => {
    mockApiGet.mockResolvedValue({ success: true, orders: [] });
  });

  it('renders the page title "Mis Pedidos"', async () => {
    render(<OrdersPage {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });
  });

  it('renders login required message when user is null', () => {
    render(<OrdersPage {...defaultProps} user={null} />);
    expect(screen.getByText('auth.loginRequired')).toBeInTheDocument();
  });

  it('renders empty state when no orders exist', async () => {
    mockApiGet.mockResolvedValue({ success: true, orders: [] });
    render(<OrdersPage {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('No hay pedidos')).toBeInTheDocument();
    });
  });

  it('renders empty state message for "all" filter', async () => {
    mockApiGet.mockResolvedValue({ success: true, orders: [] });
    render(<OrdersPage {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Aún no has realizado ningún pedido')).toBeInTheDocument();
    });
  });

  it('renders filter tabs', async () => {
    render(<OrdersPage {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });
    // Filter tabs (use getAllByText since "Pendiente" etc. may appear in badge + tab)
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Enviado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Entregado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cancelado').length).toBeGreaterThan(0);
  });

  it('renders an order card with order number when orders exist', async () => {
    const orders = [
      {
        id: 'ord-abc-123',
        numeroPedido: 'PED-001',
        status: 'delivered',
        orderDate: '2026-01-15T10:00:00Z',
        items: [{ id: 'i1', name: 'Cool Item', quantity: 2, price: 15.00 }],
        total: 30.00,
        itemCount: 2,
      },
    ];
    mockApiGet.mockResolvedValue({ success: true, orders });
    render(<OrdersPage {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('#PED-001')).toBeInTheDocument();
    });
  });

  it('renders status badge for an order', async () => {
    const orders = [
      {
        id: 'ord-abc-123',
        numeroPedido: 'PED-001',
        status: 'delivered',
        orderDate: '2026-01-15T10:00:00Z',
        items: [],
        total: 30.00,
        itemCount: 2,
      },
    ];
    mockApiGet.mockResolvedValue({ success: true, orders });
    render(<OrdersPage {...defaultProps} />);

    await waitFor(() => {
      // "Entregado" appears in the filter tab AND in the status badge
      const entregadoEls = screen.getAllByText('Entregado');
      expect(entregadoEls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders order item names when items are present', async () => {
    const orders = [
      {
        id: 'ord-xyz-456',
        numeroPedido: 'PED-002',
        status: 'pending',
        orderDate: '2026-02-10T10:00:00Z',
        items: [
          { id: 'i1', name: 'Fantastic Gadget', quantity: 1, price: 99.00 },
        ],
        total: 99.00,
        itemCount: 1,
      },
    ];
    mockApiGet.mockResolvedValue({ success: true, orders });
    render(<OrdersPage {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Fantastic Gadget')).toBeInTheDocument();
    });
  });

  it('shows total price for each order', async () => {
    const orders = [
      {
        id: 'ord-total',
        status: 'confirmed',
        orderDate: '2026-03-01T00:00:00Z',
        items: [],
        total: 149.95,
        itemCount: 3,
      },
    ];
    mockApiGet.mockResolvedValue({ success: true, orders });
    render(<OrdersPage {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('€149.95')).toBeInTheDocument();
    });
  });

  it('renders AccountSidebar', async () => {
    render(<OrdersPage {...defaultProps} />);
    expect(screen.getByTestId('account-sidebar')).toBeInTheDocument();
  });
});
