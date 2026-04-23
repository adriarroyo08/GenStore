import { CardFormData } from './types';

export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
};

export const formatExpiryDate = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
};

export const validateCardForm = (cardForm: CardFormData, t: (key: string) => string): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!cardForm.cardNumber || cardForm.cardNumber.replace(/\s/g, '').length < 13) {
    errors.cardNumber = t('payment.invalidCardNumber');
  }
  if (!cardForm.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiryDate)) {
    errors.expiryDate = t('payment.invalidExpiry');
  }
  if (!cardForm.cvv || cardForm.cvv.length < 3) {
    errors.cvv = t('payment.invalidCvv');
  }
  if (!cardForm.cardholderName.trim()) {
    errors.cardholderName = t('payment.cardholderRequired');
  }
  
  return errors;
};

export const getCardBrand = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return cleaned.startsWith('4') ? 'Visa' : 'Mastercard';
};