export interface PdfTranslations {
  budgetReport: string;
  project: string;
  client: string;
  email: string;
  phone: string;
  totalBudget: string;
  exportDate: string;
  budgetItems: string;
  id: string;
  name: string;
  amount: string;
  unit: string;
  pricePerUnit: string;
  price: string;
  task: string;
  summaryByCategory: string;
  tasks: string;
  totalEstimated: string;
  totalActual: string;
  variance: string;
  currencySymbol: string;
  // Budget categories
  labor: string;
  materials: string;
  equipment: string;
  subcontractors: string;
  permits: string;
  contingency: string;
  other: string;
}

const en: PdfTranslations = {
  budgetReport: 'Budget Report',
  project: 'Project',
  client: 'Client',
  email: 'Email',
  phone: 'Phone',
  totalBudget: 'Total Budget',
  exportDate: 'Export Date',
  budgetItems: 'Budget Items',
  id: 'ID',
  name: 'Name',
  amount: 'Amount',
  unit: 'Unit',
  pricePerUnit: 'Price/Unit',
  price: 'Price',
  task: 'Task',
  summaryByCategory: 'Summary by Category',
  tasks: 'Tasks',
  totalEstimated: 'Total Estimated',
  totalActual: 'Total Actual',
  variance: 'Variance',
  currencySymbol: '$',
  labor: 'Labor',
  materials: 'Materials',
  equipment: 'Equipment',
  subcontractors: 'Subcontractors',
  permits: 'Permits',
  contingency: 'Contingency',
  other: 'Other',
};

const uk: PdfTranslations = {
  budgetReport: 'Звіт по бюджету',
  project: 'Проєкт',
  client: 'Клієнт',
  email: 'Ел. пошта',
  phone: 'Телефон',
  totalBudget: 'Загальний бюджет',
  exportDate: 'Дата експорту',
  budgetItems: 'Бюджетні статті',
  id: 'ID',
  name: 'Назва',
  amount: 'Кількість',
  unit: 'Одиниця',
  pricePerUnit: 'Ціна/Од.',
  price: 'Ціна',
  task: 'Завдання',
  summaryByCategory: 'Підсумок за категоріями',
  tasks: 'Завдання',
  totalEstimated: 'Загальний кошторис',
  totalActual: 'Фактичні витрати',
  variance: 'Різниця',
  currencySymbol: 'грн',
  labor: 'Робота',
  materials: 'Матеріали',
  equipment: 'Обладнання',
  subcontractors: 'Субпідрядники',
  permits: 'Дозволи',
  contingency: 'Резерв',
  other: 'Інше',
};

const translations: Record<string, PdfTranslations> = { en, uk };

export function getPdfTranslations(lang: string): PdfTranslations {
  return translations[lang] || translations.en;
}

export function translateCategory(category: string, t: PdfTranslations): string {
  const key = category.toLowerCase() as keyof PdfTranslations;
  return (t[key] as string) || category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Format a number as currency string according to the language.
 * - English: $1,234.56  (symbol before)
 * - Ukrainian: 1 234,56 грн  (symbol after)
 */
export function formatPdfCurrency(amount: number, lang: string): string {
  if (lang === 'uk') {
    const formatted = new Intl.NumberFormat('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} грн`;
  }
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
