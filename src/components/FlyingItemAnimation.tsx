import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

interface FlyingItemContextType {
  triggerFly: (imageUrl: string, startX: number, startY: number) => void;
}

const FlyingItemContext = createContext<FlyingItemContextType>({ triggerFly: () => {} });

export function useFlyingItem() {
  return useContext(FlyingItemContext);
}

export function FlyingItemProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FlyingItem[]>([]);

  const triggerFly = useCallback((imageUrl: string, startX: number, startY: number) => {
    const id = `fly-${Date.now()}-${Math.random()}`;
    setItems(prev => [...prev, { id, imageUrl, startX, startY }]);

    // Auto-remove after animation
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 700);
  }, []);

  // Target: cart icon in header (approximate top-right position)
  const targetX = typeof window !== 'undefined' ? window.innerWidth - 80 : 0;
  const targetY = 28;

  return (
    <FlyingItemContext.Provider value={{ triggerFly }}>
      {children}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: targetX,
                y: targetY,
                scale: 0.15,
                opacity: 0.3,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
              className="absolute w-16 h-20 rounded-xl overflow-hidden shadow-lg"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyingItemContext.Provider>
  );
}
