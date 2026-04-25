import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroSectionProps {
  onShopNowClick: () => void;
  onLearnMoreClick?: () => void;
}

function AnimatedStat({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const isDecimal = target % 1 !== 0;
  const count = useMotionValue(0);
  const formatted = useTransform(count, (v) => isDecimal ? v.toFixed(1) : Math.round(v).toString());
  const [display, setDisplay] = useState(isDecimal ? '0.0' : '0');

  useEffect(() => {
    const controls = animate(count, target, { duration: 1.5, delay, ease: 'easeOut' });
    const unsubscribe = formatted.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [count, formatted, target, delay]);

  return (
    <motion.div
      className="flex flex-col items-center px-6 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 + delay }}
    >
      <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
        {display}{suffix}
      </span>
      <span className="text-sm sm:text-base text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
}

export function HeroSection({ onShopNowClick, onLearnMoreClick }: HeroSectionProps) {
  const { t } = useLanguage();

  const stats = [
    { target: 500, suffix: '+', label: 'Productos' },
    { target: 10, suffix: 'K+', label: 'Clientes' },
    { target: 4.8, suffix: '\u2605', label: 'Valoraci\u00f3n' },
  ];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.08),transparent)]" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
        {/* Headline */}
        <motion.h1
          id="hero-heading"
          className="text-foreground leading-[1.05] mb-6 sm:mb-8"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {t('hero.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={onShopNowClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 sm:px-14 py-4 sm:py-5 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {t('hero.shopNow')}
          </button>
        </motion.div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-8 sm:gap-12 mt-16 sm:mt-24">
          {stats.map((stat, i) => (
            <AnimatedStat key={stat.label} target={stat.target} suffix={stat.suffix} label={stat.label} delay={i * 0.2} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
        </motion.div>
      </div>
    </section>
  );
}
