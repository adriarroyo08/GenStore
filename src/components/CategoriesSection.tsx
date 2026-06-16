import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
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
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30",
        hoverColor: "hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-800/40",
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
      iconColor: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20",
      hoverColor: "hover:from-green-100 hover:to-teal-100 dark:hover:from-green-800/30 dark:hover:to-teal-800/30",
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
      <section aria-labelledby="categories-heading" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="categories-heading" className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12">
              {t("categories.title")}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
    <section aria-labelledby="categories-heading" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="categories-heading" className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12">
          {t("categories.title")}
        </h2>

        <div role="list" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const config = getCategoryConfig(category);
            const IconComponent = getIconComponent(category.icon);
            const isSelected = selectedCategory === category.slug;
            const categoryName = getCategoryTranslationKey(category);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button
                  role="listitem"
                  onClick={() => onCategoryClick(category.slug)}
                  className={`${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-primary dark:ring-offset-background shadow-xl"
                      : ""
                  } rounded-2xl overflow-hidden group cursor-pointer relative w-full border border-border/50`}
                >
                  {/* Background Image */}
                  <div className="relative h-[160px] sm:h-[200px] overflow-hidden">
                    <ImageWithFallback
                      src={config.image}
                      alt={categoryName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Category name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-lg text-left">
                        {categoryName}
                      </h3>
                    </div>

                    {/* Product count badge */}
                    {category.productCount && category.productCount > 0 && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                        {category.productCount}
                      </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-4 left-4 w-3 h-3 bg-primary rounded-full shadow-lg animate-pulse"></div>
                    )}
                  </div>
                </button>
              </motion.div>
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