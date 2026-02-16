/**
 * Format a number as currency based on the current language.
 * - English (en): $1,234.56
 * - Ukrainian (uk): 1 234,56 грн
 */
export const formatCurrency = (amount: number, lang: string): string => {
  const isUkrainian = lang?.startsWith('uk');

  if (isUkrainian) {
    const formatted = new Intl.NumberFormat('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} грн`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Returns the currency symbol/abbreviation for the given language.
 * - English: "$"
 * - Ukrainian: "грн"
 */
export const getCurrencySymbol = (lang: string): string => {
  return lang?.startsWith('uk') ? 'грн' : '$';
};
