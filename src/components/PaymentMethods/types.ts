export interface PaymentMethod {
  id: string;
  type: 'card' | 'applepay';
  isPrimary: boolean;
  name: string;
  details: string;
  last4?: string;
  expiry?: string;
  brand?: string;
}

export interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}