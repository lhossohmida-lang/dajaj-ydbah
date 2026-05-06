export const numericSlaughterFields = [
  'chickenCount',
  'averageLiveWeight',
  'liveKgPurchasePrice',
  'yieldPercentage',
  'netKgSalePrice',
  'laborCost',
  'waterElectricityCost',
  'transportCost',
  'packagingCost',
  'cleaningCost',
  'lossesCost',
  'otherCost',
];

export const emptySlaughterForm = {
  date: '',
  supplierName: '',
  chickenCount: '',
  averageLiveWeight: '',
  liveKgPurchasePrice: '',
  yieldPercentage: '',
  netKgSalePrice: '',
  laborCost: '',
  waterElectricityCost: '',
  transportCost: '',
  packagingCost: '',
  cleaningCost: '',
  lossesCost: '',
  otherCost: '',
  notes: '',
};

export function roundNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeSlaughterInput(values) {
  const normalized = {
    date: values.date,
    supplierName: values.supplierName?.trim() || '',
    notes: values.notes?.trim() || '',
  };

  numericSlaughterFields.forEach((field) => {
    normalized[field] = toNumber(values[field]);
  });

  return normalized;
}

export function calculateSlaughter(values) {
  const chickenCount = toNumber(values.chickenCount);
  const totalLiveWeight = chickenCount * toNumber(values.averageLiveWeight);
  const purchaseCost = totalLiveWeight * toNumber(values.liveKgPurchasePrice);
  const netWeight = totalLiveWeight * (toNumber(values.yieldPercentage) / 100);
  const revenue = netWeight * toNumber(values.netKgSalePrice);
  const extraExpenses =
    toNumber(values.laborCost) +
    toNumber(values.waterElectricityCost) +
    toNumber(values.transportCost) +
    toNumber(values.packagingCost) +
    toNumber(values.cleaningCost) +
    toNumber(values.lossesCost) +
    toNumber(values.otherCost);
  const totalExpenses = purchaseCost + extraExpenses;
  const netProfit = revenue - totalExpenses;
  const profitPerChicken = chickenCount > 0 ? netProfit / chickenCount : 0;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const breakEvenKgPrice = netWeight > 0 ? totalExpenses / netWeight : 0;
  const breakEvenKg = toNumber(values.netKgSalePrice) > 0 ? totalExpenses / toNumber(values.netKgSalePrice) : 0;

  return {
    totalLiveWeight: roundNumber(totalLiveWeight),
    purchaseCost: roundNumber(purchaseCost),
    netWeight: roundNumber(netWeight),
    revenue: roundNumber(revenue),
    extraExpenses: roundNumber(extraExpenses),
    totalExpenses: roundNumber(totalExpenses),
    netProfit: roundNumber(netProfit),
    profitPerChicken: roundNumber(profitPerChicken),
    profitMargin: roundNumber(profitMargin),
    breakEvenKgPrice: roundNumber(breakEvenKgPrice),
    breakEvenKg: roundNumber(breakEvenKg),
  };
}

export function aggregateSlaughters(items) {
  const totals = items.reduce(
    (accumulator, item) => ({
      slaughterCount: accumulator.slaughterCount + 1,
      chickenCount: accumulator.chickenCount + toNumber(item.chickenCount),
      totalLiveWeight: accumulator.totalLiveWeight + toNumber(item.totalLiveWeight),
      netWeight: accumulator.netWeight + toNumber(item.netWeight),
      revenue: accumulator.revenue + toNumber(item.revenue),
      extraExpenses: accumulator.extraExpenses + toNumber(item.extraExpenses),
      totalExpenses: accumulator.totalExpenses + toNumber(item.totalExpenses),
      netProfit: accumulator.netProfit + toNumber(item.netProfit),
    }),
    {
      slaughterCount: 0,
      chickenCount: 0,
      totalLiveWeight: 0,
      netWeight: 0,
      revenue: 0,
      extraExpenses: 0,
      totalExpenses: 0,
      netProfit: 0,
    },
  );

  const averageSalePrice = totals.netWeight > 0 ? totals.revenue / totals.netWeight : 0;

  return {
    ...totals,
    totalLiveWeight: roundNumber(totals.totalLiveWeight),
    netWeight: roundNumber(totals.netWeight),
    revenue: roundNumber(totals.revenue),
    extraExpenses: roundNumber(totals.extraExpenses),
    totalExpenses: roundNumber(totals.totalExpenses),
    netProfit: roundNumber(totals.netProfit),
    profitPerChicken: totals.chickenCount > 0 ? roundNumber(totals.netProfit / totals.chickenCount) : 0,
    profitMargin: totals.revenue > 0 ? roundNumber((totals.netProfit / totals.revenue) * 100) : 0,
    breakEvenKgPrice: totals.netWeight > 0 ? roundNumber(totals.totalExpenses / totals.netWeight) : 0,
    breakEvenKg: averageSalePrice > 0 ? roundNumber(totals.totalExpenses / averageSalePrice) : 0,
  };
}
