import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GenStoreLogo } from './GenStoreLogo';

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
    const controls = animate(count, target, {
      duration: 1.5,
      delay,
      ease: 'easeOut',
    });

    const unsubscribe = formatted.on('change', (v) => setDisplay(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, formatted, target, delay]);

  return (
    <motion.div
      className="flex flex-col items-center px-4 sm:px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 + delay }}
    >
      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
        {display}{suffix}
      </span>
      <span className="text-sm sm:text-base text-white/80 mt-1">{label}</span>
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
      className="relative overflow-hidden bg-slate-950"
      style={{ minHeight: '92vh' }}
    >
      {/* Gradient background layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(99,102,241,0.15),transparent)]" />
      </div>

      {/* Animated grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Large blurred orb top-right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse" />
        {/* Medium orb bottom-left */}
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Small floating shapes */}
        <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-violet-400/40 rounded-full hero-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[25%] right-[15%] w-2 h-2 bg-indigo-400/50 rounded-full hero-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[60%] left-[20%] w-4 h-4 border border-violet-400/30 rounded-sm rotate-45 hero-float" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[70%] right-[25%] w-3 h-3 border border-indigo-400/25 rounded-full hero-float" style={{ animationDelay: '2.2s' }} />
        <div className="absolute top-[40%] right-[8%] w-2 h-2 bg-fuchsia-400/30 rounded-full hero-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[80%] left-[50%] w-5 h-5 border border-violet-500/15 rounded-lg rotate-12 hero-float" style={{ animationDelay: '1.2s' }} />
        {/* Diagonal accent lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-violet-500/10 to-transparent rotate-12 origin-top" />
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/8 to-transparent -rotate-6 origin-top" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center" style={{ minHeight: '92vh' }}>
        <div className="text-center w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex justify-center mb-6 sm:mb-8"
          >
            <GenStoreLogo size={72} className="drop-shadow-2xl" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-5 sm:mb-7 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="bg-gradient-to-r from-white via-violet-200 to-indigo-200 bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-slate-300/90 mb-9 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <button
              onClick={onShopNowClick}
              className="relative group bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10">{t('hero.shopNow')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
            <button
              onClick={onLearnMoreClick}
              className="border-2 border-white/20 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              {t('hero.learnMore')}
            </button>
          </motion.div>

          {/* Animated Stats */}
          <div className="flex justify-center items-center gap-6 sm:gap-10 mt-12 sm:mt-16">
            {stats.map((stat, i) => (
              <AnimatedStat
                key={stat.label}
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                delay={i * 0.2}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-7 h-7 text-white/40" />
        </motion.div>
      </div>

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
    </section>
  );
}
