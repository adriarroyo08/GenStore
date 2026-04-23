// EU VAT rates as of 2026 (standard rates)
const EU_VAT_RATES: Record<string, number> = {
  AT: 20, // Austria
  BE: 21, // Belgium
  BG: 20, // Bulgaria
  HR: 25, // Croatia
  CY: 19, // Cyprus
  CZ: 21, // Czech Republic
  DK: 25, // Denmark
  EE: 22, // Estonia
  FI: 25.5, // Finland
  FR: 20, // France
  DE: 19, // Germany
  GR: 24, // Greece
  HU: 27, // Hungary
  IE: 23, // Ireland
  IT: 22, // Italy
  LV: 21, // Latvia
  LT: 21, // Lithuania
  LU: 17, // Luxembourg
  MT: 18, // Malta
  NL: 21, // Netherlands
  PL: 23, // Poland
  PT: 23, // Portugal
  RO: 19, // Romania
  SK: 23, // Slovakia
  SI: 22, // Slovenia
  ES: 21, // Spain
  SE: 25, // Sweden
};

const DEFAULT_VAT_RATE = 21; // Spain as default

export function getVatRate(countryCode: string): number {
  return EU_VAT_RATES[countryCode.toUpperCase()] ?? DEFAULT_VAT_RATE;
}

export function calculateVat(subtotal: number, countryCode: string): {
  rate: number;
  amount: number;
  total: number;
} {
  const rate = getVatRate(countryCode);
  const amount = Math.round((subtotal * rate) / 100 * 100) / 100;
  const total = Math.round((subtotal + amount) * 100) / 100;
  return { rate, amount, total };
}
