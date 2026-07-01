/**
 * Format a number to Indian currency format with ₹ symbol
 * e.g. 123456 → ₹1,23,456
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(0).split('.');

  // Indian grouping: last 3, then groups of 2
  let result = '';
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
    }
    result = groups.join(',') + ',' + last3;
  }

  return `${isNeg ? '-' : ''}₹${result}${decPart ? '.' + decPart : ''}`;
}

/**
 * Format a number with decimals for display
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format a date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get short month name
 */
export function getMonthName(monthNum) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[(monthNum - 1) % 12] || '';
}

/**
 * Days until a date
 */
export function daysUntil(dateStr) {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Category colors for charts
 */
export const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48',
];
