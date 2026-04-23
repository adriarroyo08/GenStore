export interface ColorOption {
  name: string;
  value: string;
  color: string;
  available: boolean;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  description: string;
  nameKey?: string;
  descriptionKey?: string;
  price: number;
  originalPrice?: number;
  onSale?: boolean;
  salePercentage?: number;
  category: string;
  brand?: string;
  rating: number;
  reviews: number;
  image: string;
  additionalImages?: string[];
  colors?: ColorOption[];
  hasColorOptions?: boolean;
  storageOptions?: string[];
  capacityOptions?: string[];
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedColorName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  access_token: string;
  profile?: any;
}

export type CurrentPage = 
  | 'home' 
  | 'catalog' 
  | 'login' 
  | 'signup' 
  | 'verify-email' 
  | 'product-detail' 
  | 'cart' 
  | 'checkout' 
  | 'account' 
  | 'contact' 
  | 'payment-methods' 
  | 'wishlist' 
  | 'orders' 
  | 'order-tracking' 
  | 'addresses' 
  | 'settings' 
  | 'about' 
  | 'support' 
  | 'faq' 
  | 'shipping-info' 
  | 'returns' 
  | 'privacy-policy' 
  | 'terms-of-service'
  | 'learn-more'
  | 'rewards'
  | 'admin'
  | 'product-database';

export interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
}

// Export review types
export * from './reviews';