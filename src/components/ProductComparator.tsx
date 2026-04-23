import React, { useState, useCallback } from 'react';
import { Product } from '../types/index';
import { useCurrency } from '../contexts/CurrencyContext';
import { X, Star, Package, Check, Minus, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

const MAX_COMPARE = 3;

interface ProductComparatorContextValue {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const ProductComparatorContext = React.createContext<ProductComparatorContextValue>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  isInCompare: () => false,
  clearCompare: () => {},
});

export function useProductComparator() {
  return React.useContext(ProductComparatorContext);
}

export function ProductComparatorProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);

  const addToCompare = useCallback((product: Product) => {
    setCompareList(prev => {
      if (prev.length >= MAX_COMPARE || prev.some(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  return (
    <ProductComparatorContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </ProductComparatorContext.Provider>
  );
}

/** Floating bar that appears when products are selected for comparison */
export function CompareFloatingBar({ onProductClick }: { onProductClick?: (product: Product) => void }) {
  const { formatPrice } = useCurrency();
  const { compareList, removeFromCompare, clearCompare } = useProductComparator();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />
        <div className="flex items-center gap-2">
          {compareList.map((p) => {
            const imgUrl = p.image && (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : null;
            return (
              <div key={p.id} className="relative w-10 h-10 rounded-lg border border-border bg-muted/30 overflow-hidden">
                {imgUrl ? (
                  <img src={imgUrl} alt={p.name} className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Package className="w-5 h-5 text-muted-foreground m-auto mt-2" />
                )}
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
          {Array.from({ length: MAX_COMPARE - compareList.length }, (_, i) => (
            <div key={`empty-${i}`} className="w-10 h-10 rounded-lg border-2 border-dashed border-border" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{compareList.length}/{MAX_COMPARE}</span>
        <button
          onClick={() => setDialogOpen(true)}
          disabled={compareList.length < 2}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Comparar
        </button>
        <button onClick={clearCompare} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Comparar productos</DialogTitle>
          <CompareTable products={compareList} onProductClick={onProductClick} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompareTable({ products, onProductClick }: { products: Product[]; onProductClick?: (product: Product) => void }) {
  const { formatPrice } = useCurrency();

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: '',
      render: (p) => {
        const imgUrl = p.image && (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : null;
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-lg bg-muted/20 overflow-hidden">
              {imgUrl ? (
                <img src={imgUrl} alt={p.name} className="w-full h-full object-contain p-2" />
              ) : (
                <Package className="w-10 h-10 text-muted-foreground/30 m-auto mt-6" />
              )}
            </div>
            <button
              onClick={() => onProductClick?.(p)}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-center line-clamp-2"
            >
              {p.name}
            </button>
          </div>
        );
      },
    },
    {
      label: 'Precio',
      render: (p) => (
        <div>
          {p.onSale && p.originalPrice && (
            <span className="text-xs text-muted-foreground line-through block">{formatPrice(p.originalPrice)}</span>
          )}
          <span className={`text-lg font-bold ${p.onSale ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
            {formatPrice(p.price)}
          </span>
        </div>
      ),
    },
    {
      label: 'Valoración',
      render: (p) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{p.rating}</span>
          <span className="text-xs text-muted-foreground">({p.reviews})</span>
        </div>
      ),
    },
    {
      label: 'Categoría',
      render: (p) => <span className="text-sm">{p.category}</span>,
    },
    {
      label: 'Marca',
      render: (p) => <span className="text-sm">{p.brand || '—'}</span>,
    },
    {
      label: 'Stock',
      render: (p) => {
        const s = p.stock ?? 0;
        return (
          <div className="flex items-center gap-1.5">
            {s > 0 ? (
              <><Check className="w-4 h-4 text-emerald-500" /><span className="text-sm text-emerald-600">{s} uds.</span></>
            ) : (
              <><Minus className="w-4 h-4 text-red-500" /><span className="text-sm text-red-500">Agotado</span></>
            )}
          </div>
        );
      },
    },
    {
      label: 'Colores',
      render: (p) => (
        <div className="flex gap-1 flex-wrap">
          {p.colors && p.colors.length > 0
            ? p.colors.map(c => (
                <span key={c.name} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c.color }} title={c.name} />
              ))
            : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg font-bold mb-4">Comparar productos</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i > 0 ? 'border-t border-border' : ''}>
                <td className="py-3 pr-4 text-sm font-medium text-muted-foreground align-middle w-24 whitespace-nowrap">{row.label}</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-3 text-center align-middle">{row.render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
