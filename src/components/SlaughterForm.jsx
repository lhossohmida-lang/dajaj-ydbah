import { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import StatsGrid from './StatsGrid.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { calculateSlaughter, emptySlaughterForm, normalizeSlaughterInput } from '../utils/calculations.js';
import { todayInputValue } from '../utils/dateUtils.js';
import { validateSlaughter } from '../utils/validation.js';

const costFields = [
  ['laborCost', 'أجور العمال'],
  ['waterElectricityCost', 'الكهرباء والماء'],
  ['transportCost', 'النقل'],
  ['packagingCost', 'الأكياس والتغليف'],
  ['cleaningCost', 'التنظيف والتعقيم'],
  ['lossesCost', 'الخسائر'],
  ['otherCost', 'مصاريف أخرى'],
];

function buildInitialForm(settings, initialValues) {
  if (initialValues) {
    return {
      ...emptySlaughterForm,
      ...initialValues,
    };
  }

  return {
    ...emptySlaughterForm,
    date: todayInputValue(),
    yieldPercentage: settings.defaultYieldPercentage,
    netKgSalePrice: settings.defaultNetKgSalePrice,
    liveKgPurchasePrice: settings.defaultLiveKgPurchasePrice,
    laborCost: 0,
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

  const calculation = useMemo(() => calculateSlaughter(normalizeSlaughterInput(values)), [values]);

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

  function handleCalculate() {
    const validationErrors = validateSlaughter(values);
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
    const validationErrors = validateSlaughter(values);
    setErrors(validationErrors);
    setShowCalculation(true);

    if (Object.keys(validationErrors).length) {
      setStatusTone('error');
      setStatusMessage('هناك أخطاء يجب تصحيحها قبل الحفظ.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit(user.uid, values);
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
