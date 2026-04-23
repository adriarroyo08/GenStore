import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { motion } from 'motion/react';

const badges = [
  {
    icon: ShieldCheck,
    title: 'Pagos 100% seguros',
    subtitle: 'Cifrado SSL',
  },
  {
    icon: Truck,
    title: 'Envío gratis +50€',
    subtitle: 'Entrega rápida',
  },
  {
    icon: RotateCcw,
    title: 'Devoluciones 14 días',
    subtitle: 'Sin complicaciones',
  },
  {
    icon: Award,
    title: 'Garantía de calidad',
    subtitle: 'Productos certificados',
  },
];

export function TrustBadgesBar() {
  return (
    <section className="bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-4 sm:flex-wrap">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="bg-primary/10 p-2 rounded-full shrink-0">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
