import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCatalogPage } from '../../components/ProductCatalogPage';
import { Product } from '../../types/index';

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

// Stub complex child components
vi.mock('../../components/ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid="product-card" data-product-id={product.id}>
      {product.name}
    </div>
  ),
}));

vi.mock('../../components/RecentlyViewed', () => ({
  RecentlyViewed: () => <div data-testid="recently-viewed" />,
}));

vi.mock('../../components/SkeletonProductCard', () => ({
  SkeletonProductGrid: () => <div data-testid="skeleton-grid" />,
}));

vi.mock('../../components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/ui/slider', () => ({
  Slider: ({ min, max, value }: any) => (
    <input
      type="range"
      data-testid="price-slider"
      min={min}
      max={max}
      defaultValue={value?.[0] ?? 0}
      readOnly
    />
  ),
}));

vi.mock('../../components/ui/switch', () => ({
  Switch: ({ checked }: any) => (
    <input type="checkbox" data-testid="switch" defaultChecked={checked} readOnly />
  ),
}));

vi.mock('../../components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

// --- Test data ---

let idCounter = 0;
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: `p-${++idCounter}`,
  name: 'Test Product',
  price: 19.99,
  description: 'A test product',
  category: 'electronics',
  image: 'https://example.com/img.jpg',
  rating: 4.0,
  stock: 5,
  ...overrides,
});

const defaultProps = {
  products: [],
  searchQuery: '',
  setSearchQuery: vi.fn(),
  cartItemsCount: 0,
  cart: [],
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  cartTotal: 0,
  user: null,
  onLoginClick: vi.fn(),
  onLogout: vi.fn(),
  onHomeClick: vi.fn(),
  onCartClick: vi.fn(),
  onCheckoutClick: vi.fn(),
  onAccountClick: vi.fn(),
  onAddToCart: vi.fn(),
  onProductSelect: vi.fn(),
  onSearch: vi.fn(),
  selectedCategory: null,
  onBackToHome: vi.fn(),
  onClearFilters: vi.fn(),
  onCategoryChange: vi.fn(),
  wishlist: [],
  onToggleWishlist: vi.fn(),
};

describe('ProductCatalogPage', () => {
  it('renders the catalog heading', () => {
    render(<ProductCatalogPage {...defaultProps} />);
    expect(screen.getByText('Catalogo')).toBeInTheDocument();
  });

  it('shows product count of 0 when no products', () => {
    render(<ProductCatalogPage {...defaultProps} />);
    expect(screen.getByText(/0 productos/)).toBeInTheDocument();
  });

  it('renders a product card for each provided product', () => {
    const products = [
      makeProduct({ id: 'pa1', name: 'Widget Alpha' }),
      makeProduct({ id: 'pa2', name: 'Widget Beta' }),
    ];
    render(<ProductCatalogPage {...defaultProps} products={products} />);
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Widget Alpha')).toBeInTheDocument();
    expect(screen.getByText('Widget Beta')).toBeInTheDocument();
  });

  it('renders category pills when products have categories', () => {
    const products = [
      makeProduct({ id: 'c1', category: 'Electronica', categorySlug: 'electronica' } as any),
    ];
    render(<ProductCatalogPage {...defaultProps} products={products} />);
    // "Todos" pill is always rendered
    expect(screen.getByText('Todos')).toBeInTheDocument();
    // Category may appear in multiple places (pill + sidebar); use getAllByText
    const electronicaEls = screen.getAllByText(/Electronica/);
    expect(electronicaEls.length).toBeGreaterThan(0);
  });

  it('renders the "Todos" category pill by default', () => {
    render(<ProductCatalogPage {...defaultProps} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('shows search results heading when searchQuery is provided', () => {
    render(<ProductCatalogPage {...defaultProps} searchQuery="laptop" />);
    expect(screen.getByText(/Resultados para "laptop"/)).toBeInTheDocument();
  });

  it('renders product cards that display product names', () => {
    const onProductSelect = vi.fn();
    const products = [makeProduct({ id: 'click1', name: 'Clickable Product' })];
    render(<ProductCatalogPage {...defaultProps} products={products} onProductSelect={onProductSelect} />);
    expect(screen.getByText('Clickable Product')).toBeInTheDocument();
  });

  it('renders Filtros text somewhere on the page (mobile filter button)', () => {
    render(<ProductCatalogPage {...defaultProps} />);
    // "Filtros" appears in both the mobile trigger and the sidebar header
    const filtrosEls = screen.getAllByText('Filtros');
    expect(filtrosEls.length).toBeGreaterThan(0);
  });

  it('renders the Categorias section heading in the filter sidebar', () => {
    const products = [
      makeProduct({ id: 'sidebar1', category: 'Ropa', categorySlug: 'ropa' } as any),
    ];
    render(<ProductCatalogPage {...defaultProps} products={products} />);
    // "Categorias" may appear in both the desktop sidebar and mobile sheet — use getAllByText
    const categoriasEls = screen.getAllByText('Categorias');
    expect(categoriasEls.length).toBeGreaterThan(0);
  });

  it('renders the price slider in filter sidebar', () => {
    const products = [makeProduct({ id: 'pr1', price: 10 }), makeProduct({ id: 'pr2', price: 50 })];
    render(<ProductCatalogPage {...defaultProps} products={products} />);
    const sliders = screen.getAllByTestId('price-slider');
    expect(sliders.length).toBeGreaterThan(0);
  });
});
