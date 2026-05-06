import { numericSlaughterFields } from './calculations.js';

const fieldLabels = {
  date: 'التاريخ',
  supplierName: 'اسم المورد',
  chickenCount: 'عدد الدجاج',
  averageLiveWeight: 'الوزن المتوسط للدجاجة',
  liveKgPurchasePrice: 'سعر شراء الكيلو حي',
  yieldPercentage: 'نسبة التصافي',
  netKgSalePrice: 'سعر بيع الكيلو صافي',
  laborCost: 'أجور العمال',
  waterElectricityCost: 'الكهرباء والماء',
  transportCost: 'النقل',
  packagingCost: 'الأكياس والتغليف',
  cleaningCost: 'التنظيف والتعقيم',
  lossesCost: 'الخسائر',
  otherCost: 'مصاريف أخرى',
};

export function validateSlaughter(values) {
  const errors = {};
  const workers = Array.isArray(values.workers) ? values.workers : [];
  const filledWorkers = workers.filter((worker) => worker.name?.trim() || worker.salary !== '' || worker.salary === 0);

  if (!values.date) {
    errors.date = 'التاريخ مطلوب.';
  }

  if (!values.supplierName?.trim()) {
    errors.supplierName = 'اسم المورد مطلوب.';
  }

  if (!filledWorkers.length) {
    errors.workers = 'أضف عاملًا واحدًا على الأقل مع راتبه.';
  }

  workers.forEach((worker, index) => {
    const hasAnyValue = worker.name?.trim() || worker.salary !== '' || worker.salary === 0;

    if (!hasAnyValue) {
      return;
    }

    const salary = Number(worker.salary);

    if (!worker.name?.trim()) {
      errors[`workerName-${index}`] = 'اسم العامل مطلوب.';
    }

    if (worker.salary === '' || worker.salary === null || worker.salary === undefined) {
      errors[`workerSalary-${index}`] = 'راتب العامل مطلوب.';
    } else if (!Number.isFinite(salary)) {
      errors[`workerSalary-${index}`] = 'راتب العامل يجب أن يكون رقمًا صحيحًا.';
    } else if (salary < 0) {
      errors[`workerSalary-${index}`] = 'راتب العامل لا يمكن أن يكون سالبًا.';
    }
  });

  numericSlaughterFields.forEach((field) => {
    const rawValue = values[field];
    const numberValue = Number(rawValue);

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      errors[field] = `${fieldLabels[field]} مطلوب.`;
      return;
    }

    if (!Number.isFinite(numberValue)) {
      errors[field] = `${fieldLabels[field]} يجب أن يكون رقمًا صحيحًا.`;
      return;
    }

    if (numberValue < 0) {
      errors[field] = `${fieldLabels[field]} لا يمكن أن يكون سالبًا.`;
    }
  });

  if (Number(values.chickenCount) < 1) {
    errors.chickenCount = 'عدد الدجاج يجب أن يكون 1 على الأقل.';
  }

  if (Number(values.yieldPercentage) < 1 || Number(values.yieldPercentage) > 100) {
    errors.yieldPercentage = 'نسبة التصافي يجب أن تكون بين 1 و100.';
  }

  if (Number(values.liveKgPurchasePrice) < 0) {
    errors.liveKgPurchasePrice = 'سعر الشراء لا يمكن أن يكون أقل من 0.';
  }

  if (Number(values.netKgSalePrice) < 0) {
    errors.netKgSalePrice = 'سعر البيع لا يمكن أن يكون أقل من 0.';
  }

  return errors;
}

export function validateSettings(values) {
  const errors = {};

  if (!values.slaughterhouseName?.trim()) {
    errors.slaughterhouseName = 'اسم المدبحة مطلوب.';
  }

  if (!values.currency?.trim()) {
    errors.currency = 'العملة مطلوبة.';
  }

  if (Number(values.defaultYieldPercentage) < 1 || Number(values.defaultYieldPercentage) > 100) {
    errors.defaultYieldPercentage = 'نسبة التصافي الافتراضية يجب أن تكون بين 1 و100.';
  }

  if (values.defaultLiveKgPurchasePrice === '' || Number(values.defaultLiveKgPurchasePrice) < 0) {
    errors.defaultLiveKgPurchasePrice = 'سعر الشراء الافتراضي يجب أن يكون 0 أو أكثر.';
  }

  if (values.defaultNetKgSalePrice === '' || Number(values.defaultNetKgSalePrice) < 0) {
    errors.defaultNetKgSalePrice = 'سعر البيع الافتراضي يجب أن يكون 0 أو أكثر.';
  }

  return errors;
}
