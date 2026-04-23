import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
    { target: 4.8, suffix: '★', label: 'Valoración' },
  ];

  return (
    <section aria-labelledby="hero-heading" className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0" aria-hidden="true">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1758654860100-32cd2e83e74a?w=1920&h=1080&fit=crop&auto=format"
          alt="Modern online store with premium products"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 to-green-600/70 dark:from-slate-900/80 dark:to-slate-800/80"></div>
        {/* Additional overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Medical Equipment Background Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1758654860100-32cd2e83e74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwZXF1aXBtZW50JTIwcGh5c2lvdGhlcmFweXxlbnwxfHx8fDE3NTg4OTM0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
          }}
        ></div>

        {/* Gradient Overlays */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-400/10 to-transparent dark:from-blue-600/10 animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-green-400/10 to-transparent dark:from-green-600/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="text-center">
          <motion.h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 max-w-3xl mx-auto drop-shadow-md px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={onShopNowClick}
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              {t('hero.shopNow')}
            </button>
            <button
              onClick={onLearnMoreClick}
              className="border-2 border-white/80 text-white px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] rounded-lg text-base sm:text-lg font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            >
              {t('hero.learnMore')}
            </button>
          </motion.div>

          {/* Animated Stats */}
          <div className="flex justify-center items-center gap-6 sm:gap-10 mt-10 sm:mt-14">
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

      {/* Decorative tech elements */}
      <div className="absolute top-10 left-10 w-6 h-6 border-2 border-white/30 rotate-45 animate-pulse" aria-hidden="true"></div>
      <div className="absolute top-20 right-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} aria-hidden="true"></div>
      <div className="absolute bottom-20 left-20 w-8 h-8 border-2 border-white/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} aria-hidden="true"></div>
      <div className="absolute bottom-10 right-10 w-3 h-3 bg-white/30 rotate-45 animate-bounce" style={{ animationDelay: '2s' }} aria-hidden="true"></div>

      {/* Scroll indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
        <ChevronDown className="w-8 h-8 text-white/60 animate-bounce" />
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg className="w-full h-16 text-white/10" fill="currentColor" viewBox="0 0 1440 54">
          <path d="M0,22 C120,40 240,40 360,22 C480,4 600,4 720,22 C840,40 960,40 1080,22 C1200,4 1320,4 1440,22 L1440,54 L0,54 Z"></path>
        </svg>
      </div>
    </section>
  );
}
