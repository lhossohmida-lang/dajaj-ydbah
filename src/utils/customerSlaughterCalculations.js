import { roundNumber, toNumber } from './calculations.js';

export const additionalServiceLabels = {
  cleaning: 'تنظيف',
  cutting: 'تقطيع',
  packaging: 'تغليف',
};

export const paymentMethodLabels = {
  cash: 'نقدا',
  transfer: 'تحويل',
  card: 'بطاقة',
  debt: 'دين',
};

export const customerSlaughterNumericFields = [
  'chickenCount',
  'weight',
  'servicePricePerChicken',
  'manualTotalAmount',
  'extraServicesFee',
  'paidAmount',
];

export const emptyCustomerSlaughterForm = {
  date: '',
  time: '',
  customerStatus: 'new',
  customerName: '',
  phone: '',
  chickenCount: '',
  weight: '',
  pricingType: 'perChicken',
  servicePricePerChicken: '',
  manualTotalAmount: '',
  additionalServices: {
    cleaning: false,
    cutting: false,
    packaging: false,
  },
  extraServicesFee: '',
  paidAmount: '',
  paymentMethod: 'cash',
  notes: '',
};

export function normalizeAdditionalServices(additionalServices = {}) {
  return Object.keys(additionalServiceLabels).reduce((services, key) => {
    services[key] = Boolean(additionalServices[key]);
    return services;
  }, {});
}

export function getSelectedAdditionalServices(additionalServices = {}) {
  return Object.entries(normalizeAdditionalServices(additionalServices))
    .filter(([, selected]) => selected)
    .map(([key]) => additionalServiceLabels[key]);
}

export function calculateCustomerSlaughterService(values) {
  const chickenCount = toNumber(values.chickenCount);
  const pricingType = values.pricingType === 'total' ? 'total' : 'perChicken';
  const baseServiceAmount =
    pricingType === 'total'
      ? toNumber(values.manualTotalAmount)
      : chickenCount * toNumber(values.servicePricePerChicken);
  const extraServicesFee = toNumber(values.extraServicesFee);
  const totalAmount = baseServiceAmount + extraServicesFee;
  const paidAmount = toNumber(values.paidAmount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  return {
    baseServiceAmount: roundNumber(baseServiceAmount),
    totalAmount: roundNumber(totalAmount),
    paidAmount: roundNumber(paidAmount),
    remainingAmount: roundNumber(remainingAmount),
    serviceProfit: roundNumber(totalAmount),
  };
}

export function normalizeCustomerSlaughterInput(values) {
  const normalized = {
    date: values.date,
    time: values.time,
    customerStatus: values.customerStatus === 'previous' ? 'previous' : 'new',
    customerName: values.customerName?.trim() || '',
    phone: values.phone?.trim() || '',
    pricingType: values.pricingType === 'total' ? 'total' : 'perChicken',
    additionalServices: normalizeAdditionalServices(values.additionalServices),
    paymentMethod: values.paymentMethod || 'cash',
    notes: values.notes?.trim() || '',
  };

  customerSlaughterNumericFields.forEach((field) => {
    normalized[field] = toNumber(values[field]);
  });

  return normalized;
}

export function aggregateCustomerSlaughterServices(items) {
  const totals = items.reduce(
    (accumulator, item) => ({
      serviceCount: accumulator.serviceCount + 1,
      chickenCount: accumulator.chickenCount + toNumber(item.chickenCount),
      weight: accumulator.weight + toNumber(item.weight),
      baseServiceAmount: accumulator.baseServiceAmount + toNumber(item.baseServiceAmount),
      extraServicesFee: accumulator.extraServicesFee + toNumber(item.extraServicesFee),
      totalAmount: accumulator.totalAmount + toNumber(item.totalAmount),
      paidAmount: accumulator.paidAmount + toNumber(item.paidAmount),
      remainingAmount: accumulator.remainingAmount + toNumber(item.remainingAmount),
      serviceProfit: accumulator.serviceProfit + toNumber(item.serviceProfit),
    }),
    {
      serviceCount: 0,
      chickenCount: 0,
      weight: 0,
      baseServiceAmount: 0,
      extraServicesFee: 0,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      serviceProfit: 0,
    },
  );

  return {
    ...totals,
    weight: roundNumber(totals.weight),
    baseServiceAmount: roundNumber(totals.baseServiceAmount),
    extraServicesFee: roundNumber(totals.extraServicesFee),
    totalAmount: roundNumber(totals.totalAmount),
    paidAmount: roundNumber(totals.paidAmount),
    remainingAmount: roundNumber(totals.remainingAmount),
    serviceProfit: roundNumber(totals.serviceProfit),
  };
}
