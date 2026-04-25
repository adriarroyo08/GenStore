import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({ formatPrice: (p: number) => `€${p.toFixed(2)}`, convertPrice: (p: number) => p }),
}));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));
vi.mock('../../components/ProductComparator', () => ({
  useProductComparator: () => ({ addToCompare: vi.fn(), removeFromCompare: vi.fn(), isInCompare: () => false }),
}));
vi.mock('../../components/ProductQuickView', () => ({
  ProductQuickView: () => <div>QuickView</div>,
}));
vi.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: () => null,
}));

import React from 'react';
import { ProductCard } from '../../components/ProductCard';

const mockProduct = {
  id: '1', name: 'Test Product', description: 'Desc', price: 49.99,
  category: 'Electronics', rating: 4.5, reviews: 120, image: 'https://example.com/img.jpg', stock: 5,
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeTruthy();
    expect(screen.getByText('€49.99')).toBeTruthy();
  });

  it('shows discount badge when on sale', () => {
    render(<ProductCard product={{ ...mockProduct, onSale: true, originalPrice: 99.99 }} />);
    expect(screen.getByText('-50%')).toBeTruthy();
  });

  it('shows out of stock overlay when stock is 0', () => {
    render(<ProductCard product={{ ...mockProduct, stock: 0 }} />);
    expect(screen.getByText('Agotado')).toBeTruthy();
  });

  it('calls onProductClick when name is clicked', async () => {
    const onClick = vi.fn();
    render(<ProductCard product={mockProduct} onProductClick={onClick} />);
    await userEvent.click(screen.getByText('Test Product'));
    expect(onClick).toHaveBeenCalledWith(mockProduct);
  });

  it('shows wishlist button when user is logged in', () => {
    const onToggle = vi.fn();
    render(<ProductCard product={mockProduct} user={{ id: '1' }} onToggleWishlist={onToggle} />);
    expect(screen.getByLabelText(/favoritos/i)).toBeTruthy();
  });
});
