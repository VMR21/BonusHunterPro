export type Currency = 'USD' | 'CAD' | 'AUD';

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const currencyMap = {
    USD: { locale: 'en-US', currency: 'USD' },
    CAD: { locale: 'en-CA', currency: 'CAD' },
    AUD: { locale: 'en-AU', currency: 'AUD' },
  };

  const config = currencyMap[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency): string {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    AUD: 'A$',
  };
  return symbols[currency];
}
