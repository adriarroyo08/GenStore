import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface ModernLoadingScreenProps {
  message?: string;
  stage?: 'loading' | 'basic' | 'full';
  progress?: number;
}

export function ModernLoadingScreen({ 
  message = "Cargando...", 
  stage = 'loading',
  progress 
}: ModernLoadingScreenProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const stages = [
    { key: 'loading', label: t('loading.initializing') || 'Inicializando...', progress: 0 },
    { key: 'basic', label: t('loading.settingUp') || 'Configurando interfaz...', progress: 50 },
    { key: 'full', label: t('loading.finalizing') || 'Finalizando...', progress: 100 }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);
  const currentProgress = progress ?? stages[currentStageIndex]?.progress ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-accent/10" />
      
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/20 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Main Loading Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center space-y-8 p-8"
      >
        {/* Logo/Brand Animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-primary-foreground text-2xl font-bold"
            >
              G
            </motion.div>
          </div>
          
          {/* Pulsing Ring */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-primary"
          />
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GenStore
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('app.tagline') || 'Tu tienda online de confianza'}
          </p>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-80 max-w-sm"
        >
          <div className="relative">
            {/* Progress Track */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>
            
            {/* Progress Indicator */}
            <motion.div
              className="absolute -top-8 left-0 text-sm font-medium text-foreground"
              animate={{ left: `${currentProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ transform: "translateX(-50%)" }}
            >
              {Math.round(currentProgress)}%
            </motion.div>
          </div>
        </motion.div>

        {/* Stage Information */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-foreground font-medium">{message}</p>
          
          {/* Stage Indicators */}
          <div className="flex items-center justify-center space-x-3">
            {stages.map((stageItem, index) => (
              <motion.div
                key={stageItem.key}
                className={`flex items-center space-x-2 ${
                  index <= currentStageIndex 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full border-2 ${
                    index < currentStageIndex
                      ? 'bg-primary border-primary'
                      : index === currentStageIndex
                      ? 'border-primary'
                      : 'border-muted-foreground'
                  }`}
                  animate={
                    index === currentStageIndex
                      ? { scale: [1, 1.3, 1] }
                      : {}
                  }
                  transition={{ duration: 1, repeat: Infinity }}
                />
                {index < stages.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    index < currentStageIndex 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground'
                  }`} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom Wave Animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,100 C300,150 600,50 900,100 C1050,125 1150,75 1200,100 L1200,200 L0,200 Z"
            fill="currentColor"
            className="text-primary/10"
            animate={{
              d: [
                "M0,100 C300,150 600,50 900,100 C1050,125 1150,75 1200,100 L1200,200 L0,200 Z",
                "M0,120 C300,170 600,70 900,120 C1050,145 1150,95 1200,120 L1200,200 L0,200 Z",
                "M0,100 C300,150 600,50 900,100 C1050,125 1150,75 1200,100 L1200,200 L0,200 Z"
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}