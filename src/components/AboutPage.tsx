import React from 'react';
import { Heart, Shield, Dumbbell, Target, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutPageProps {
  onContactClick: () => void;
  onCatalogClick?: () => void;
  onBackToHome?: () => void;
}

export function AboutPage({ onContactClick, onCatalogClick, onBackToHome }: AboutPageProps) {
  const catalogAction = onCatalogClick || onBackToHome;
  const { t } = useLanguage();

  return (
    <section aria-labelledby="about-heading" className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-primary-foreground/70 font-medium tracking-wider uppercase text-sm mb-4">
              {t('about.tagline')}
            </p>
            <h1 id="about-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              {t('about.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
              {t('about.heroDescription')}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Story Section */}
        <section aria-labelledby="about-story-heading" className="py-16 md:py-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="about-story-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t('about.ourStory')}
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          </div>
          <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>{t('about.storyParagraph1')}</p>
            <p>{t('about.storyParagraph2')}</p>
            <p>{t('about.storyParagraph3')}</p>
          </div>
        </section>

        {/* Pillars Section */}
        <section aria-labelledby="about-pillars-heading" className="py-16 md:py-20">
          <h2 id="about-pillars-heading" className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
            {t('about.whyGenStore')}
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-card border border-border rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.pillar1Title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.pillar1Description')}
              </p>
            </article>

            <article className="bg-card border border-border rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.pillar2Title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.pillar2Description')}
              </p>
            </article>

            <article className="bg-card border border-border rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Dumbbell className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{t('about.pillar3Title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.pillar3Description')}
              </p>
            </article>
          </div>
        </section>

        {/* Target Audience Section */}
        <section aria-labelledby="about-audience-heading" className="py-16 md:py-20">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Target className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h2 id="about-audience-heading" className="text-2xl md:text-3xl font-bold text-foreground">
                {t('about.forWho')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {t(`about.audience${i}Title`)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`about.audience${i}Description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section aria-labelledby="about-cta-heading" className="py-16 md:py-24 text-center max-w-2xl mx-auto">
          <h2 id="about-cta-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {t('about.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {catalogAction && (
              <button
                onClick={catalogAction}
                className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-colors font-medium text-lg"
              >
                {t('about.exploreCatalog')}
              </button>
            )}
            <button
              onClick={onContactClick}
              className="border border-border text-foreground px-8 py-3.5 rounded-xl hover:bg-muted transition-colors font-medium text-lg"
            >
              {t('contact.getInTouch')}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}