// Translation fixes for missing admin category keys
export const adminCategoryTranslations = {
  en: {
    smartphones: "Smartphones",
    laptops: "Laptops", 
    headphones: "Headphones",
    gaming: "Gaming",
    accessories: "Accessories",
    tablets: "Tablets",
    "home-appliances": "Home Appliances"
  },
  es: {
    smartphones: "Smartphones",
    laptops: "Laptops",
    headphones: "Audífonos", 
    gaming: "Gaming",
    accessories: "Accesorios",
    tablets: "Tablets",
    "home-appliances": "Electrodomésticos del Hogar"
  }
};

// Function to get admin category translation
export function getAdminCategoryTranslation(key: string, language: 'en' | 'es'): string {
  return adminCategoryTranslations[language][key as keyof typeof adminCategoryTranslations.en] || key;
}