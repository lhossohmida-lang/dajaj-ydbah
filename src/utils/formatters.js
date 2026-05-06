const numberFormatter = new Intl.NumberFormat('ar-DZ', {
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('ar-DZ', {
  maximumFractionDigits: 0,
});

export function formatNumber(value, compact = false) {
  const parsed = Number(value) || 0;
  return compact ? compactNumberFormatter.format(parsed) : numberFormatter.format(parsed);
}

export function formatCurrency(value, currency = 'دج') {
  return `${formatNumber(value)} ${currency}`;
}

export function formatKg(value) {
  return `${formatNumber(value)} كغ`;
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`;
}
