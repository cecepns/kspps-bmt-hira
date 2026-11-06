/**
 * Utility functions for currency and number formatting with dot thousand separator (id-ID)
 */

export const formatRibuan = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';
  // Extract only digits
  const clean = str.replace(/\D/g, '');
  if (!clean) return '';
  // Remove leading zeros unless it's standalone "0"
  const normalized = clean.replace(/^0+(?!$)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseRibuan = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';
  const clean = str.replace(/\D/g, '');
  return clean.replace(/^0+(?!$)/, '');
};

export const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
};

