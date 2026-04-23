import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, Activity, Package, Sparkles, Stethoscope, Zap } from "lucide-react";
import { apiClient } from "../lib/apiClient";

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
}

interface CategoriesSectionProps {
  selectedCategory: string | null;
  onCategoryClick: (category: string) => void;
}

export function CategoriesSection({
  selectedCategory,
  onCategoryClick,
}: CategoriesSectionProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        
        const result = await apiClient.get<any>('/categories');
        
        if (result.success && Array.isArray(result.categories)) {
          // Filter only active categories and sort by order
          const activeCategories = result.categories
            .filter(cat => cat.isActive)
            .sort((a, b) => a.order - b.order);
          setCategories(activeCategories);
        } else {
          console.warn('No categories found or invalid response');
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Map icons from database to Lucide React components
  const getIconComponent = (iconName?: string) => {
    const iconMap = {
      'heart-pulse': Activity,
      'activity': Activity,
      'sparkles': Sparkles,
      'heart': Heart,
      'stethoscope': Stethoscope,
      'zap': Zap,
      'package': Package
    };
    return iconMap[iconName?.toLowerCase() || 'package'] || Package;
  };

  // Map categories to display configuration
  const getCategoryConfig = (category: Category) => {
    const slug = category.slug.toLowerCase();
    
    // Base configurations for known categories
    const configs = {
      'productos': {
        iconColor: "text-blue-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
        hoverColor: "hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30",
        image: "https://images.unsplash.com/photo-1637580724561-ee200f66dae3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaHlzaW90aGVyYXB5JTIwZXF1aXBtZW50fGVufDF8fHx8MTc1NzE4NDgyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      },
      'cosmetica': {
        iconColor: "text-pink-600",
        bgColor: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
        hoverColor: "hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-800/30 dark:hover:to-rose-800/30",
        image: "https://images.unsplash.com/photo-1624574966266-1cdd65b74500?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpYyUyMGJlYXV0eSUyMHByb2R1Y3RzfGVufDF8fHx8MTc1NzI1MDAwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      }
    };

    // Return specific config or default
    return configs[slug] || {
      iconColor: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      hoverColor: "hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/30 dark:hover:to-teal-800/30",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format"
    };
  };

  // Get translation key for category name
  const getCategoryTranslationKey = (category: Category) => {
    const slug = category.slug.toLowerCase();
    // Check if translation key exists in our translation files
    const possibleKeys = [
      `categories.${slug}`,
      `categories.${category.name.toLowerCase()}`
    ];
    
    // For now, use the category name directly if no specific translation exists
    // This allows for dynamic categories while maintaining compatibility
    return category.name;
  };

  if (isLoading) {
    return (
      <section aria-labelledby="categories-heading" className="py-12 sm:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 id="categories-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">
              {t("categories.title")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              {t("categories.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-2xl h-[160px] sm:h-[180px]"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="categories-heading" className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 id="categories-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">
            {t("categories.title")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            {t("categories.subtitle")}
          </p>
        </div>

        <div role="list" className={`grid gap-4 sm:gap-6 lg:gap-8 mx-auto ${
          categories.length === 1 ? 'grid-cols-1 max-w-lg' :
          categories.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' :
          categories.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl'
        }`}>
          {categories.map((category) => {
            const config = getCategoryConfig(category);
            const IconComponent = getIconComponent(category.icon);
            const isSelected = selectedCategory === category.slug;
            const categoryName = getCategoryTranslationKey(category);
            
            return (
              <button
                role="listitem"
                key={category.id}
                onClick={() => onCategoryClick(category.slug)}
                className={`${config.bgColor} ${config.hoverColor} ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-primary dark:ring-offset-background shadow-xl scale-105"
                    : ""
                } relative overflow-hidden rounded-2xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-border/50 group`}
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-300">
                  <ImageWithFallback
                    src={config.image}
                    alt={categoryName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/5 dark:from-black/10 dark:via-transparent dark:to-black/5"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center justify-center h-full min-h-[160px] sm:min-h-[180px]">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${config.iconColor} mb-4 sm:mb-6 bg-white/90 dark:bg-white/10 rounded-2xl shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground bg-white/90 dark:bg-white/10 px-4 sm:px-6 py-2 sm:py-3 rounded-xl backdrop-blur-sm text-center shadow-sm group-hover:bg-white/95 dark:group-hover:bg-white/15 transition-colors duration-300">
                    {categoryName}
                  </h3>
                  
                  {/* Product count badge */}
                  {category.productCount && category.productCount > 0 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                      {category.productCount}
                    </div>
                  )}
                  
                  {/* Subtle indicator for selection */}
                  {isSelected && (
                    <div className="absolute top-4 left-4 w-3 h-3 bg-primary rounded-full shadow-lg animate-pulse"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Show message if no categories */}
        {categories.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("categories.noCategories")}
            </h3>
            <p className="text-muted-foreground">
              {t("categories.noCategoriesDesc")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}