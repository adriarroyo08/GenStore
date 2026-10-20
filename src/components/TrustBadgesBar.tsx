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
    <section className="bg-muted/30 border-y border-border/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {index > 0 && (
                <span className="hidden md:block border-l border-border h-8 -ml-4 mr-4" aria-hidden="true" />
              )}
              <badge.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">{badge.title}</p>
                <p className="text-xs text-muted-foreground/70">{badge.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
