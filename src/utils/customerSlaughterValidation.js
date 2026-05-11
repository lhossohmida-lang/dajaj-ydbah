import { customerSlaughterNumericFields, paymentMethodLabels } from './customerSlaughterCalculations.js';

const fieldLabels = {
  chickenCount: 'عدد الدجاج',
  weight: 'الوزن',
  servicePricePerChicken: 'سعر الخدمة لكل دجاجة',
  manualTotalAmount: 'السعر الإجمالي',
  extraServicesFee: 'مبلغ الخدمات الإضافية',
  paidAmount: 'المبلغ المدفوع',
};

export function validateCustomerSlaughterService(values, calculation) {
  const errors = {};

  if (!values.date) {
    errors.date = 'التاريخ مطلوب.';
  }

  if (!values.time) {
    errors.time = 'الوقت مطلوب.';
  }

  if (!values.customerName?.trim()) {
    errors.customerName = 'اسم الزبون مطلوب.';
  }

  if (!['perChicken', 'total'].includes(values.pricingType)) {
    errors.pricingType = 'اختر طريقة حساب صحيحة.';
  }

  if (!paymentMethodLabels[values.paymentMethod]) {
    errors.paymentMethod = 'اختر طريقة الدفع.';
  }

  customerSlaughterNumericFields.forEach((field) => {
    const rawValue = values[field];

    if (field === 'weight' && (rawValue === '' || rawValue === null || rawValue === undefined)) {
      return;
    }

    if (field === 'manualTotalAmount' && values.pricingType !== 'total') {
      return;
    }

    if (field === 'servicePricePerChicken' && values.pricingType === 'total') {
      return;
    }

    const numberValue = Number(rawValue);

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      errors[field] = `${fieldLabels[field]} مطلوب.`;
      return;
    }

    if (!Number.isFinite(numberValue)) {
      errors[field] = `${fieldLabels[field]} يجب أن يكون رقما صحيحا.`;
      return;
    }

    if (numberValue < 0) {
      errors[field] = `${fieldLabels[field]} لا يمكن أن يكون سالبا.`;
    }
  });

  if (Number(values.chickenCount) < 1) {
    errors.chickenCount = 'عدد الدجاج يجب أن يكون 1 على الأقل.';
  }

  if (values.pricingType === 'perChicken' && Number(values.servicePricePerChicken) <= 0) {
    errors.servicePricePerChicken = 'سعر الخدمة لكل دجاجة يجب أن يكون أكبر من 0.';
  }

  if (values.pricingType === 'total' && Number(values.manualTotalAmount) <= 0) {
    errors.manualTotalAmount = 'السعر الإجمالي يجب أن يكون أكبر من 0.';
  }

  if (calculation && Number(values.paidAmount) > calculation.totalAmount) {
    errors.paidAmount = 'المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الإجمالي.';
  }

  return errors;
}
