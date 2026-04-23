import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, Currency } from '../contexts/CurrencyContext';

export const CurrencySelector = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currencies: { code: Currency; name: string; symbol: string; flag: string }[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  ];

  const currentCurrency = currencies.find(curr => curr.code === currency)!;

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref || dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        aria-label="Seleccionar moneda"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentCurrency.flag}</span>
        <span className="font-medium text-sm">{currentCurrency.code}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                  currency === curr.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{curr.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{curr.code}</div>
                  <div className="text-xs text-gray-500">{curr.name}</div>
                </div>
                <span className="text-sm font-medium">{curr.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';