import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WishlistPage } from '../../components/WishlistPage';
import { Product } from '../../types';

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

// Mock Button to avoid Radix Slot issues
vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...rest}>
      {children}
    </button>
  ),
}));

// Full motion mock including span and AnimatePresence
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    span: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// --- Test data ---

const makeProduct = (id: string, name: string, overrides: Partial<Product> = {}): Product => ({
  id,
  name,
  price: 25.00,
  description: 'Test product',
  category: 'test',
  image: 'https://example.com/img.jpg',
  rating: 4.0,
  stock: 5,
  ...overrides,
});

const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test User' };

const defaultProps = {
  user: mockUser,
  wishlist: [],
  products: [],
  onToggleWishlist: vi.fn(),
  onAddToCart: vi.fn(),
  onClearWishlist: vi.fn(),
  onBackToAccount: vi.fn(),
  onProfileClick: vi.fn(),
  onOrdersClick: vi.fn(),
  onAddressesClick: vi.fn(),
  onPaymentMethodsClick: vi.fn(),
  onWishlistClick: vi.fn(),
  onRewardsClick: vi.fn(),
  onSettingsClick: vi.fn(),
  onAdminClick: vi.fn(),
  onCartClick: vi.fn(),
  onCatalogClick: vi.fn(),
  onProductSelect: vi.fn(),
  onLogout: vi.fn(),
};

describe('WishlistPage', () => {
  it('shows empty state when wishlist is empty', () => {
    render(<WishlistPage {...defaultProps} />);
    expect(screen.getByText('wishlist.empty')).toBeInTheDocument();
  });

  it('shows empty state description when wishlist is empty', () => {
    render(<WishlistPage {...defaultProps} />);
    expect(screen.getAllByText('wishlist.emptyDescription').length).toBeGreaterThan(0);
  });

  it('renders start shopping button in empty state', () => {
    render(<WishlistPage {...defaultProps} />);
    expect(screen.getByText('wishlist.startShopping')).toBeInTheDocument();
  });

  it('calls onCatalogClick when start shopping button is clicked', () => {
    const onCatalogClick = vi.fn();
    render(<WishlistPage {...defaultProps} onCatalogClick={onCatalogClick} />);
    fireEvent.click(screen.getByText('wishlist.startShopping'));
    expect(onCatalogClick).toHaveBeenCalledTimes(1);
  });

  it('renders wishlist items when products are in wishlist', () => {
    const products = [makeProduct('p1', 'Great Widget'), makeProduct('p2', 'Cool Gadget')];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1', 'p2']}
        products={products}
      />
    );
    expect(screen.getByText('Great Widget')).toBeInTheDocument();
    expect(screen.getByText('Cool Gadget')).toBeInTheDocument();
  });

  it('shows remove button (heart icon) for each wishlist item', () => {
    const products = [makeProduct('p1', 'Widget One')];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1']}
        products={products}
      />
    );
    const removeButtons = screen.getAllByLabelText('wishlist.removeFromWishlist');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('calls onToggleWishlist when remove button is clicked', () => {
    const onToggleWishlist = vi.fn();
    const products = [makeProduct('p1', 'Widget One')];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1']}
        products={products}
        onToggleWishlist={onToggleWishlist}
      />
    );
    const removeButton = screen.getByLabelText('wishlist.removeFromWishlist');
    fireEvent.click(removeButton);
    expect(onToggleWishlist).toHaveBeenCalledWith('p1');
  });

  it('calls onClearWishlist when clear wishlist button is clicked', () => {
    const onClearWishlist = vi.fn();
    const products = [makeProduct('p1', 'Widget One')];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1']}
        products={products}
        onClearWishlist={onClearWishlist}
      />
    );
    fireEvent.click(screen.getByText('wishlist.clearWishlist'));
    expect(onClearWishlist).toHaveBeenCalledTimes(1);
  });

  it('renders the add all to cart button when items are in wishlist', () => {
    const products = [makeProduct('p1', 'Widget One')];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1']}
        products={products}
      />
    );
    expect(screen.getByText('wishlist.addAllToCart')).toBeInTheDocument();
  });

  it('renders product prices for wishlist items', () => {
    const products = [makeProduct('p1', 'Widget One', { price: 25.00, stock: 5 })];
    render(
      <WishlistPage
        {...defaultProps}
        wishlist={['p1']}
        products={products}
      />
    );
    // Price appears in both the summary bar total and the product card price
    const priceEls = screen.getAllByText('€25.00');
    expect(priceEls.length).toBeGreaterThan(0);
  });
});
