import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceDisplay } from './PriceDisplay';
import { VariantSelector } from './VariantSelector';
import { useState } from 'react';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, variantId?: string) => void;
  onViewDetail: () => void;
  formatPrice: (n: number) => string;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onViewDetail,
  formatPrice,
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  if (!product) return null;

  const displayPrecio = selectedVariant?.precio ?? product.price ?? product.precio;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const mainImage = (selectedVariant?.imagenes?.length > 0
    ? selectedVariant.imagenes[0]
    : product.image || product.imagenes?.[0]) || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-full z-50 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="aspect-[4/5] bg-muted">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name || product.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 md:p-8 flex flex-col">
                {product.category && (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {product.category}
                  </span>
                )}
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {product.name || product.nombre}
                </h2>

                <div className="mt-3">
                  <PriceDisplay product={product} size="lg" />
                </div>

                {/* Variants */}
                {product.has_variants && product.variants?.length > 0 && (
                  <div className="mt-4">
                    <VariantSelector
                      variants={product.variants}
                      onVariantSelect={setSelectedVariant}
                    />
                  </div>
                )}

                <div className="mt-auto pt-6 space-y-3">
                  <button
                    onClick={() => {
                      onAddToCart(product, selectedVariant?.id);
                      onClose();
                    }}
                    disabled={displayStock <= 0 || (product.has_variants && !selectedVariant)}
                    className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {displayStock <= 0 ? 'Agotado' : 'Añadir al carrito'}
                  </button>
                  <button
                    onClick={() => { onClose(); onViewDetail(); }}
                    className="w-full rounded-full border border-border py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Ver detalle completo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
