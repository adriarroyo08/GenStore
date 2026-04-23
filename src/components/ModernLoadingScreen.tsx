import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { GenStoreLogo } from './GenStoreLogo';

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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/40 to-indigo-950/60" />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-violet-400/20 rounded-full"
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
        {/* Logo with pulse animation */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <GenStoreLogo size={72} />

          {/* Pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-violet-500"
          />
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            GenStore
          </h1>
          <p className="text-slate-400 mt-2">
            {t('app.tagline') || 'Tu tienda online de confianza'}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-80 max-w-sm"
        >
          <div className="relative">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>

            <motion.div
              className="absolute -top-8 left-0 text-sm font-medium text-slate-300"
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
          <p className="text-slate-200 font-medium">{message}</p>

          {/* Stage Indicators */}
          <div className="flex items-center justify-center space-x-3">
            {stages.map((stageItem, index) => (
              <motion.div
                key={stageItem.key}
                className={`flex items-center space-x-2 ${
                  index <= currentStageIndex
                    ? 'text-violet-400'
                    : 'text-slate-600'
                }`}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full border-2 ${
                    index < currentStageIndex
                      ? 'bg-violet-500 border-violet-500'
                      : index === currentStageIndex
                      ? 'border-violet-500'
                      : 'border-slate-600'
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
                      ? 'bg-violet-500'
                      : 'bg-slate-600'
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
              className="w-2 h-2 bg-violet-500 rounded-full"
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
    </motion.div>
  );
}
