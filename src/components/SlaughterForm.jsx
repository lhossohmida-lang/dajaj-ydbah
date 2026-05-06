import { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, RotateCcw, Save, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import StatsGrid from './StatsGrid.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { calculateSlaughter, emptySlaughterForm, getWorkersLaborCost, normalizeSlaughterInput } from '../utils/calculations.js';
import { todayInputValue } from '../utils/dateUtils.js';
import { formatCurrency } from '../utils/formatters.js';
import { validateSlaughter } from '../utils/validation.js';

const costFields = [
  ['waterElectricityCost', 'الكهرباء والماء'],
  ['transportCost', 'النقل'],
  ['packagingCost', 'الأكياس والتغليف'],
  ['cleaningCost', 'التنظيف والتعقيم'],
  ['lossesCost', 'الخسائر'],
  ['otherCost', 'مصاريف أخرى'],
];

const emptyWorker = { name: '', salary: '' };

function calculateFormLaborCost(workers) {
  return getWorkersLaborCost(workers);
}

function buildWorkers(initialValues) {
  if (Array.isArray(initialValues?.workers) && initialValues.workers.length) {
    return initialValues.workers.map((worker) => ({
      name: worker.name || '',
      salary: worker.salary ?? '',
    }));
  }

  if (initialValues && Number(initialValues.laborCost) > 0) {
    return [{ name: 'عمال العملية', salary: initialValues.laborCost }];
  }

  return [{ ...emptyWorker }];
}

function withWorkersTotal(values) {
  const laborCost = calculateFormLaborCost(values.workers);

  return {
    ...values,
    laborCost,
  };
}

function buildInitialForm(settings, initialValues) {
  if (initialValues) {
    const workers = buildWorkers(initialValues);

    return {
      ...emptySlaughterForm,
      ...initialValues,
      workers,
      laborCost: calculateFormLaborCost(workers),
    };
  }

  const workers = buildWorkers(null);

  return {
    ...emptySlaughterForm,
    workers,
    date: todayInputValue(),
    yieldPercentage: settings.defaultYieldPercentage,
    netKgSalePrice: settings.defaultNetKgSalePrice,
    liveKgPurchasePrice: settings.defaultLiveKgPurchasePrice,
    laborCost: calculateFormLaborCost(workers),
    waterElectricityCost: 0,
    transportCost: 0,
    packagingCost: 0,
    cleaningCost: 0,
    lossesCost: 0,
    otherCost: 0,
  };
}

export default function SlaughterForm({ mode = 'create', initialValues, onSubmit }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [values, setValues] = useState(() => buildInitialForm(settings, initialValues));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('info');
  const [showCalculation, setShowCalculation] = useState(Boolean(initialValues));

  useEffect(() => {
    setValues(buildInitialForm(settings, initialValues));
  }, [settings, initialValues]);

  const preparedValues = useMemo(() => withWorkersTotal(values), [values]);
  const calculation = useMemo(() => calculateSlaughter(normalizeSlaughterInput(preparedValues)), [preparedValues]);
  const laborCost = preparedValues.laborCost;

  function updateValue(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  function updateWorker(index, field, value) {
    setValues((current) => {
      const workers = current.workers.map((worker, workerIndex) =>
        workerIndex === index
          ? {
              ...worker,
              [field]: value,
            }
          : worker,
      );

      return {
        ...current,
        workers,
        laborCost: calculateFormLaborCost(workers),
      };
    });
    setErrors((current) => ({
      ...current,
      workers: '',
      [`workerName-${index}`]: field === 'name' ? '' : current[`workerName-${index}`],
      [`workerSalary-${index}`]: field === 'salary' ? '' : current[`workerSalary-${index}`],
    }));
  }

  function addWorker() {
    setValues((current) => {
      const workers = [...current.workers, { ...emptyWorker }];

      return {
        ...current,
        workers,
        laborCost: calculateFormLaborCost(workers),
      };
    });
  }

  function removeWorker(index) {
    setValues((current) => {
      const workers =
        current.workers.length > 1
          ? current.workers.filter((_, workerIndex) => workerIndex !== index)
          : [{ ...emptyWorker }];

      return {
        ...current,
        workers,
        laborCost: calculateFormLaborCost(workers),
      };
    });
    setErrors((current) =>
      Object.fromEntries(
        Object.entries({
          ...current,
          workers: '',
        }).filter(([key]) => !key.startsWith('workerName-') && !key.startsWith('workerSalary-')),
      ),
    );
  }

  function handleCalculate() {
    const validationErrors = validateSlaughter(preparedValues);
    setErrors(validationErrors);
    setShowCalculation(true);
    setStatusTone(Object.keys(validationErrors).length ? 'error' : 'success');
    setStatusMessage(Object.keys(validationErrors).length ? 'يرجى تصحيح الحقول قبل حفظ العملية.' : 'تم حساب النتائج بنجاح.');
  }

  function handleReset() {
    setValues(buildInitialForm(settings, null));
    setErrors({});
    setShowCalculation(false);
    setStatusTone('info');
    setStatusMessage('تم إفراغ الحقول.');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateSlaughter(preparedValues);
    setErrors(validationErrors);
    setShowCalculation(true);

    if (Object.keys(validationErrors).length) {
      setStatusTone('error');
      setStatusMessage('هناك أخطاء يجب تصحيحها قبل الحفظ.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit(user.uid, preparedValues);
      setStatusTone('success');
      setStatusMessage(mode === 'create' ? 'تم حفظ العملية بنجاح.' : 'تم تحديث العملية بنجاح.');

      if (mode === 'create') {
        navigate('/records');
      } else {
        navigate('/records');
      }
    } catch (submitError) {
      setStatusTone('error');
      setStatusMessage(submitError.message || 'حدث خطأ أثناء حفظ العملية.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {statusMessage && <ErrorMessage message={statusMessage} tone={statusTone} />}

      <section className="app-card p-5">
        <div className="mb-5">
          <h3 className="text-lg font-black">معلومات عامة</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">بيانات المورد وتاريخ العملية.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="التاريخ" error={errors.date}>
            <input
              type="date"
              className="app-input"
              value={values.date}
              onChange={(event) => updateValue('date', event.target.value)}
            />
          </FormField>
          <FormField label="اسم المورد" error={errors.supplierName}>
            <input
              type="text"
              className="app-input"
              value={values.supplierName}
              onChange={(event) => updateValue('supplierName', event.target.value)}
              placeholder="مثال: مزرعة الخير"
            />
          </FormField>
          <FormField label="ملاحظات">
            <textarea
              className="app-input min-h-11 resize-y"
              value={values.notes}
              onChange={(event) => updateValue('notes', event.target.value)}
              placeholder="لا توجد ملاحظات"
            />
          </FormField>
        </div>
      </section>

      <section className="app-card p-5">
        <div className="mb-5">
          <h3 className="text-lg font-black">معلومات الدجاج</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">الأوزان والأسعار ونسبة التصافي.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FormField label="عدد الدجاج" error={errors.chickenCount}>
            <input
              type="number"
              min="1"
              className="app-input"
              value={values.chickenCount}
              onChange={(event) => updateValue('chickenCount', event.target.value)}
            />
          </FormField>
          <FormField label="الوزن المتوسط حي بالكيلو" error={errors.averageLiveWeight}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.averageLiveWeight}
              onChange={(event) => updateValue('averageLiveWeight', event.target.value)}
            />
          </FormField>
          <FormField label="سعر شراء الكيلو حي" error={errors.liveKgPurchasePrice}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.liveKgPurchasePrice}
              onChange={(event) => updateValue('liveKgPurchasePrice', event.target.value)}
            />
          </FormField>
          <FormField label="نسبة التصافي %" error={errors.yieldPercentage}>
            <input
              type="number"
              min="1"
              max="100"
              step="0.01"
              className="app-input"
              value={values.yieldPercentage}
              onChange={(event) => updateValue('yieldPercentage', event.target.value)}
            />
          </FormField>
          <FormField label="سعر بيع الكيلو صافي" error={errors.netKgSalePrice}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="app-input"
              value={values.netKgSalePrice}
              onChange={(event) => updateValue('netKgSalePrice', event.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="app-card p-5">
        <div className="mb-5">
          <h3 className="text-lg font-black">المصاريف</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">كل مصاريف التشغيل الإضافية للعملية.</p>
        </div>
        <div className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-base font-black">العمال</h4>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">أضف كل عامل مع راتبه الخاص.</p>
              </div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-sm font-black text-teal-700 shadow-sm dark:bg-stone-950 dark:text-teal-300">
              إجمالي أجور العمال: {formatCurrency(laborCost, settings.currency)}
            </div>
          </div>
          {errors.workers && <p className="mb-3 text-sm font-semibold text-rose-600 dark:text-rose-400">{errors.workers}</p>}
          <div className="space-y-3">
            {values.workers.map((worker, index) => (
              <div key={`worker-${index}`} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950 md:grid-cols-[1fr_220px_44px]">
                <FormField label={`اسم العامل ${index + 1}`} error={errors[`workerName-${index}`]}>
                  <input
                    type="text"
                    className="app-input"
                    value={worker.name}
                    onChange={(event) => updateWorker(index, 'name', event.target.value)}
                    placeholder="اسم العامل"
                  />
                </FormField>
                <FormField label="الراتب" error={errors[`workerSalary-${index}`]}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="app-input"
                    value={worker.salary}
                    onChange={(event) => updateWorker(index, 'salary', event.target.value)}
                    placeholder="0"
                  />
                </FormField>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeWorker(index)}
                    className="app-button-danger h-11 w-11 px-0"
                    title="حذف العامل"
                    aria-label="حذف العامل"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addWorker} className="app-button-secondary mt-4">
            <Plus className="h-4 w-4" aria-hidden="true" />
            إضافة عامل
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {costFields.map(([field, label]) => (
            <FormField key={field} label={label} error={errors[field]}>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                value={values[field]}
                onChange={(event) => updateValue(field, event.target.value)}
              />
            </FormField>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleCalculate} className="app-button-secondary">
          <Calculator className="h-4 w-4" aria-hidden="true" />
          حساب
        </button>
        <button type="submit" disabled={saving} className="app-button-primary">
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? 'جاري الحفظ...' : mode === 'create' ? 'حفظ العملية' : 'حفظ التعديل'}
        </button>
        <button type="button" onClick={handleReset} className="app-button-secondary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          إفراغ الحقول
        </button>
      </div>

      {showCalculation && (
        <section className="space-y-4">
          <h3 className="text-lg font-black">نتائج الحساب</h3>
          <StatsGrid stats={{ slaughterCount: 1, chickenCount: Number(values.chickenCount) || 0, ...calculation }} currency={settings.currency} />
        </section>
      )}
    </form>
  );
}
