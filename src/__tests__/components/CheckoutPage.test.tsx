import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutPage } from '../../components/CheckoutPage';
import { CartItem } from '../../App';

// --- Mocks ---

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, isDark: false }),
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
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../lib/stripe', () => ({
  stripePromise: Promise.resolve(null),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => null,
  useElements: () => null,
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

vi.mock('../../constants/locationData', () => ({
  PHONE_PREFIXES: [{ code: 'ES', prefix: '+34', flag: '🇪🇸', name: 'Spain' }],
  SPAIN_PROVINCES: [],
  flagUrl: () => '',
}));

vi.mock('../../components/CheckoutPaymentSection', () => ({
  CheckoutPaymentSection: () => <div data-testid="payment-section" />,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Stub global fetch for the settings endpoint
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ envio_gratis_umbral: 50, coste_envio_estandar: 9.99, iva_porcentaje: 8, puntos_enabled: true }),
  }) as any;
});

const mockCartItem: CartItem = {
  id: 'p1',
  name: 'Test Product',
  price: 29.99,
  quantity: 1,
  image: 'https://example.com/img.jpg',
  category: 'electronics',
  description: 'A test product',
  rating: 4.5,
  stock: 10,
};

function renderCheckout(overrides: Partial<Parameters<typeof CheckoutPage>[0]> = {}) {
  const defaults = {
    cart: [mockCartItem],
    user: { id: 'u1', email: 'test@test.com', name: 'Test User' },
    cartTotal: 29.99,
    onBackToCart: vi.fn(),
    onContinueToPayment: vi.fn(),
    onOrderComplete: vi.fn(),
  };
  return render(<CheckoutPage {...defaults} {...overrides} />);
}

describe('CheckoutPage', () => {
  it('renders the checkout stepper with 3 steps', () => {
    renderCheckout();
    // Stepper shows step labels
    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText('Facturación')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
  });

  it('shows shipping information step (step 1) by default', () => {
    renderCheckout();
    // The legend/heading for shipping step
    expect(screen.getByText('checkout.shippingInformation')).toBeInTheDocument();
  });

  it('renders firstName and lastName input fields in step 1', () => {
    renderCheckout();
    expect(screen.getByLabelText(/checkout\.firstName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/checkout\.lastName/i)).toBeInTheDocument();
  });

  it('renders email input field pre-filled with user email', () => {
    renderCheckout();
    const emailInput = screen.getByDisplayValue('test@test.com');
    expect(emailInput).toBeInTheDocument();
  });

  it('shows empty cart message when cart is empty', () => {
    renderCheckout({ cart: [] });
    expect(screen.getByText('cart.empty')).toBeInTheDocument();
  });

  it('calls onBackToCart when back button is clicked on empty cart', () => {
    const onBackToCart = vi.fn();
    renderCheckout({ cart: [], onBackToCart });
    const btn = screen.getByRole('button', { name: /cart\.goToCatalog/i });
    btn.click();
    expect(onBackToCart).toHaveBeenCalledTimes(1);
  });

  it('renders the checkout page title', () => {
    renderCheckout();
    expect(screen.getByText('checkout.title')).toBeInTheDocument();
  });

  it('renders back button to go back to cart', () => {
    renderCheckout();
    // The back link text is t('general.back')
    expect(screen.getByText('general.back')).toBeInTheDocument();
  });
});
