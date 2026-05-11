import { useMemo, useState } from 'react';
import {
  Banknote,
  CalendarClock,
  ClipboardList,
  Eye,
  Phone,
  Printer,
  Save,
  Scissors,
  User,
  Weight,
} from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FormField from '../components/FormField.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useCustomerSlaughterServices } from '../hooks/useCustomerSlaughterServices.js';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { createCustomerSlaughterService } from '../services/customerSlaughterService.js';
import {
  additionalServiceLabels,
  aggregateCustomerSlaughterServices,
  calculateCustomerSlaughterService,
  emptyCustomerSlaughterForm,
  getSelectedAdditionalServices,
  normalizeAdditionalServices,
  paymentMethodLabels,
} from '../utils/customerSlaughterCalculations.js';
import { buildCustomers } from '../utils/customerRecords.js';
import { todayInputValue } from '../utils/dateUtils.js';
import { formatCurrency, formatKg, formatNumber } from '../utils/formatters.js';
import { validateCustomerSlaughterService } from '../utils/customerSlaughterValidation.js';

function currentTimeInputValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function buildInitialForm() {
  return {
    ...emptyCustomerSlaughterForm,
    date: todayInputValue(),
    time: currentTimeInputValue(),
    extraServicesFee: 0,
    paidAmount: 0,
  };
}

function getCustomerStatusLabel(status) {
  return status === 'previous' ? 'زبون سابق من الوثائق' : 'زبون جديد';
}

function getServiceLabels(record) {
  const labels = Array.isArray(record.selectedAdditionalServices)
    ? record.selectedAdditionalServices
    : getSelectedAdditionalServices(record.additionalServices);

  return labels.length ? labels.join('، ') : 'لا توجد خدمات إضافية';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createInvoiceMarkup(record, settings) {
  const currency = settings.currency;
  const rows = [
    ['نوع الزبون', getCustomerStatusLabel(record.customerStatus)],
    ['اسم الزبون', record.customerName],
    ['رقم الهاتف', record.phone || 'غير مسجل'],
    ['التاريخ والوقت', `${record.date} - ${record.time}`],
    ['عدد الدجاج', formatNumber(record.chickenCount, true)],
    ['الوزن', record.weight ? formatKg(record.weight) : 'غير مسجل'],
    ['طريقة الحساب', record.pricingType === 'total' ? 'سعر إجمالي' : 'سعر لكل دجاجة'],
    ['سعر الخدمة لكل دجاجة', record.pricingType === 'perChicken' ? formatCurrency(record.servicePricePerChicken, currency) : '-'],
    ['الخدمات الإضافية', getServiceLabels(record)],
    ['مبلغ الخدمات الإضافية', formatCurrency(record.extraServicesFee, currency)],
    ['المبلغ الإجمالي', formatCurrency(record.totalAmount, currency)],
    ['المبلغ المدفوع', formatCurrency(record.paidAmount, currency)],
    ['المبلغ المتبقي', formatCurrency(record.remainingAmount, currency)],
    ['طريقة الدفع', paymentMethodLabels[record.paymentMethod] || record.paymentMethod],
    ['ملاحظات', record.notes || 'لا توجد ملاحظات'],
  ];

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>فاتورة خدمة الذبح</title>
    <style>
      body { font-family: Tahoma, Arial, sans-serif; margin: 32px; color: #1c1917; }
      .invoice { max-width: 760px; margin: 0 auto; border: 1px solid #d6d3d1; border-radius: 8px; padding: 24px; }
      h1 { margin: 0; font-size: 26px; }
      .muted { color: #78716c; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th, td { border-bottom: 1px solid #e7e5e4; padding: 12px; text-align: right; }
      th { width: 34%; background: #f5f5f4; }
      .total { margin-top: 22px; display: grid; gap: 8px; font-weight: 700; }
      .note { margin-top: 24px; color: #57534e; font-size: 13px; }
      @media print { body { margin: 0; } .invoice { border: 0; } }
    </style>
  </head>
  <body>
    <main class="invoice">
      <h1>${escapeHtml(settings.slaughterhouseName || 'مدبحة الدجاج')}</h1>
      <p class="muted">فاتورة خدمة ذبح دجاج الزبائن</p>
      <table>
        <tbody>
          ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">
        <span>الإجمالي: ${escapeHtml(formatCurrency(record.totalAmount, currency))}</span>
        <span>المدفوع: ${escapeHtml(formatCurrency(record.paidAmount, currency))}</span>
        <span>المتبقي: ${escapeHtml(formatCurrency(record.remainingAmount, currency))}</span>
      </div>
      <p class="note">هذا السجل خاص بخدمة الذبح فقط ولا يؤثر على مخزون الدجاج أو عمليات البيع.</p>
    </main>
  </body>
</html>`;
}

function printInvoice(record, settings) {
  const printWindow = window.open('', '_blank', 'width=860,height=900');

  if (!printWindow) {
    window.alert('تعذر فتح نافذة الطباعة. تحقق من السماح بالنوافذ المنبثقة.');
    return;
  }

  printWindow.document.write(createInvoiceMarkup(record, settings));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function ServiceSummary({ stats, currency }) {
  const cards = [
    { title: 'عمليات خدمة الذبح', value: formatNumber(stats.serviceCount, true), icon: ClipboardList, tone: 'teal' },
    { title: 'دجاج الزبائن', value: formatNumber(stats.chickenCount, true), icon: Weight, tone: 'sky' },
    { title: 'أرباح خدمة الذبح', value: formatCurrency(stats.serviceProfit, currency), icon: Banknote, tone: 'emerald' },
    { title: 'المبالغ المتبقية', value: formatCurrency(stats.remainingAmount, currency), icon: CalendarClock, tone: stats.remainingAmount > 0 ? 'amber' : 'stone' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function InvoiceModal({ record, settings, onClose }) {
  if (!record) {
    return null;
  }

  const currency = settings.currency;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 px-4 py-6">
      <article className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft dark:border-stone-800 dark:bg-stone-950">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-black">فاتورة خدمة الذبح</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{record.customerName} - {record.date} {record.time}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="app-button-secondary" onClick={() => printInvoice(record, settings)}>
              <Printer className="h-4 w-4" />
              طباعة
            </button>
            <button type="button" className="app-button-secondary" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <InvoiceItem label="اسم الزبون" value={record.customerName} />
            <InvoiceItem label="نوع الزبون" value={getCustomerStatusLabel(record.customerStatus)} />
            <InvoiceItem label="رقم الهاتف" value={record.phone || 'غير مسجل'} />
            <InvoiceItem label="عدد الدجاج" value={formatNumber(record.chickenCount, true)} />
            <InvoiceItem label="الوزن" value={record.weight ? formatKg(record.weight) : 'غير مسجل'} />
            <InvoiceItem label="الخدمات الإضافية" value={getServiceLabels(record)} />
            <InvoiceItem label="طريقة الدفع" value={paymentMethodLabels[record.paymentMethod] || record.paymentMethod} />
            <InvoiceItem label="المبلغ الإجمالي" value={formatCurrency(record.totalAmount, currency)} strong />
            <InvoiceItem label="المبلغ المدفوع" value={formatCurrency(record.paidAmount, currency)} />
            <InvoiceItem label="المبلغ المتبقي" value={formatCurrency(record.remainingAmount, currency)} strong />
            <InvoiceItem label="ملاحظات" value={record.notes || 'لا توجد ملاحظات'} />
          </div>
        </div>
      </article>
    </div>
  );
}

function InvoiceItem({ label, value, strong = false }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs font-bold text-stone-500 dark:text-stone-400">{label}</p>
      <p className={`mt-1 break-words text-sm ${strong ? 'font-black text-teal-700 dark:text-teal-300' : 'font-bold'}`}>{value}</p>
    </div>
  );
}

export default function CustomerSlaughterPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { services, loading, error } = useCustomerSlaughterServices();
  const { slaughters, loading: slaughtersLoading, error: slaughtersError } = useSlaughters();
  const [values, setValues] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const calculation = useMemo(() => calculateCustomerSlaughterService(values), [values]);
  const serviceStats = useMemo(() => aggregateCustomerSlaughterServices(services), [services]);
  const recentServices = useMemo(() => services.slice(0, 8), [services]);
  const previousCustomers = useMemo(() => buildCustomers(services, slaughters), [services, slaughters]);
  const selectedPreviousCustomerKey = useMemo(() => {
    if (values.customerStatus !== 'previous') {
      return '';
    }

    return previousCustomers.find((customer) => customer.name === values.customerName && customer.phone === values.phone)?.key || '';
  }, [previousCustomers, values.customerName, values.customerStatus, values.phone]);

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

  function updateAdditionalService(field, checked) {
    setValues((current) => ({
      ...current,
      additionalServices: {
        ...normalizeAdditionalServices(current.additionalServices),
        [field]: checked,
      },
    }));
  }

  function selectPreviousCustomer(customerKey) {
    if (!customerKey) {
      setValues((current) => ({
        ...current,
        customerStatus: 'new',
      }));
      return;
    }

    const selectedCustomer = previousCustomers.find((customer) => customer.key === customerKey);

    if (!selectedCustomer) {
      return;
    }

    setValues((current) => ({
      ...current,
      customerStatus: 'previous',
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone || current.phone,
    }));
    setErrors((current) => ({
      ...current,
      customerName: '',
      phone: '',
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateCustomerSlaughterService(values, calculation);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      setMessageTone('error');
      setMessage('هناك أخطاء يجب تصحيحها قبل حفظ خدمة الذبح.');
      return;
    }

    try {
      setSaving(true);
      const documentRef = await createCustomerSlaughterService(user.uid, values);
      const invoiceRecord = {
        id: documentRef.id,
        ...values,
        ...calculation,
        customerStatus: values.customerStatus,
        additionalServices: normalizeAdditionalServices(values.additionalServices),
        selectedAdditionalServices: getSelectedAdditionalServices(values.additionalServices),
        notes: values.notes || 'لا توجد ملاحظات',
        affectsInventory: false,
      };

      setSelectedInvoice(invoiceRecord);
      setValues(buildInitialForm());
      setErrors({});
      setMessageTone('success');
      setMessage('تم حفظ خدمة الذبح كدخل خدمة مستقل بدون التأثير على مخزون الدجاج.');
    } catch (submitError) {
      setMessageTone('error');
      setMessage(submitError.message || 'حدث خطأ أثناء حفظ خدمة الذبح.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || slaughtersLoading) {
    return <LoadingScreen label="جاري تحميل خدمات الذبح..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">ذبح دجاج الزبائن</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">تسجيل دخل خدمة للزبائن الذين يحضرون دجاجهم الخاص دون إنقاص مخزون البيع.</p>
        </div>
      </div>

      <ErrorMessage message={error || slaughtersError || message} tone={error || slaughtersError ? 'error' : messageTone} />

      <ServiceSummary stats={serviceStats} currency={settings.currency} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="app-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-lg font-black">بيانات الزبون والوقت</h4>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">هذه العملية تسجل كخدمة فقط وليست عملية شراء أو بيع دجاج.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FormField label="زبون سابق / من الوثائق السابقة">
              <select
                className="app-input"
                value={selectedPreviousCustomerKey}
                onChange={(event) => selectPreviousCustomer(event.target.value)}
              >
                <option value="">زبون جديد</option>
                {previousCustomers.map((customer) => (
                  <option key={customer.key} value={customer.key}>
                    {customer.phone ? `${customer.name} - ${customer.phone}` : customer.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="اسم الزبون" error={errors.customerName}>
              <input
                type="text"
                className="app-input"
                value={values.customerName}
                onChange={(event) => {
                  updateValue('customerName', event.target.value);
                  updateValue('customerStatus', 'new');
                }}
                placeholder="مثال: محمد"
              />
            </FormField>
            <FormField label="رقم الهاتف اختياري" error={errors.phone}>
              <div className="relative">
                <Phone className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="tel"
                  className="app-input pr-9"
                value={values.phone}
                  onChange={(event) => {
                    updateValue('phone', event.target.value);
                    updateValue('customerStatus', 'new');
                  }}
                  placeholder="0550..."
                />
              </div>
            </FormField>
            <FormField label="التاريخ" error={errors.date}>
              <input type="date" className="app-input" value={values.date} onChange={(event) => updateValue('date', event.target.value)} />
            </FormField>
            <FormField label="الوقت" error={errors.time}>
              <input type="time" className="app-input" value={values.time} onChange={(event) => updateValue('time', event.target.value)} />
            </FormField>
          </div>
        </section>

        <section className="app-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Scissors className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-lg font-black">تفاصيل الخدمة</h4>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">أدخل عدد دجاج الزبون وطريقة حساب أجرة الخدمة.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="عدد الدجاج" error={errors.chickenCount}>
              <input
                type="number"
                min="1"
                className="app-input"
                value={values.chickenCount}
                onChange={(event) => updateValue('chickenCount', event.target.value)}
              />
            </FormField>
            <FormField label="طريقة حساب السعر" error={errors.pricingType}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={values.pricingType === 'perChicken' ? 'app-button-primary' : 'app-button-secondary'}
                  onClick={() => updateValue('pricingType', 'perChicken')}
                >
                  لكل دجاجة
                </button>
                <button
                  type="button"
                  className={values.pricingType === 'total' ? 'app-button-primary' : 'app-button-secondary'}
                  onClick={() => updateValue('pricingType', 'total')}
                >
                  إجمالي
                </button>
              </div>
            </FormField>
            {values.pricingType === 'perChicken' ? (
              <FormField label="سعر الخدمة لكل دجاجة" error={errors.servicePricePerChicken}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="app-input"
                  value={values.servicePricePerChicken}
                  onChange={(event) => updateValue('servicePricePerChicken', event.target.value)}
                />
              </FormField>
            ) : (
              <FormField label="السعر الإجمالي" error={errors.manualTotalAmount}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="app-input"
                  value={values.manualTotalAmount}
                  onChange={(event) => updateValue('manualTotalAmount', event.target.value)}
                />
              </FormField>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/60">
              <span className="app-label">خدمات إضافية اختيارية</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(additionalServiceLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm font-bold dark:border-stone-800 dark:bg-stone-950">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal-700"
                      checked={Boolean(values.additionalServices[key])}
                      onChange={(event) => updateAdditionalService(key, event.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <FormField label="مبلغ الخدمات الإضافية" error={errors.extraServicesFee}>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                value={values.extraServicesFee}
                onChange={(event) => updateValue('extraServicesFee', event.target.value)}
              />
            </FormField>
          </div>
        </section>

        <section className="app-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-lg font-black">الدفع والفاتورة</h4>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">المتبقي يحسب تلقائيا من الإجمالي ناقص المدفوع.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="المبلغ الإجمالي">
              <input type="text" className="app-input font-black text-teal-700 dark:text-teal-300" value={formatCurrency(calculation.totalAmount, settings.currency)} readOnly />
            </FormField>
            <FormField label="المبلغ المدفوع" error={errors.paidAmount}>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                value={values.paidAmount}
                onChange={(event) => updateValue('paidAmount', event.target.value)}
              />
            </FormField>
            <FormField label="المبلغ المتبقي">
              <input type="text" className="app-input font-black text-amber-700 dark:text-amber-300" value={formatCurrency(calculation.remainingAmount, settings.currency)} readOnly />
            </FormField>
            <FormField label="طريقة الدفع" error={errors.paymentMethod}>
              <select className="app-input" value={values.paymentMethod} onChange={(event) => updateValue('paymentMethod', event.target.value)}>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="ملاحظات">
              <textarea
                className="app-input min-h-24 resize-y"
                value={values.notes}
                onChange={(event) => updateValue('notes', event.target.value)}
                placeholder="لا توجد ملاحظات"
              />
            </FormField>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="app-button-primary">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'جاري الحفظ...' : 'حفظ خدمة الذبح'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h4 className="text-lg font-black">آخر خدمات الذبح</h4>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">كل سجل هنا دخل خدمة مستقل ولا يخص مخزون الدجاج.</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-right text-sm dark:divide-stone-800">
              <thead className="bg-stone-50 text-xs font-black uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">التاريخ</th>
                  <th className="whitespace-nowrap px-4 py-3">الزبون</th>
                  <th className="whitespace-nowrap px-4 py-3">الوثيقة</th>
                  <th className="whitespace-nowrap px-4 py-3">الهاتف</th>
                  <th className="whitespace-nowrap px-4 py-3">عدد الدجاج</th>
                  <th className="whitespace-nowrap px-4 py-3">الخدمات</th>
                  <th className="whitespace-nowrap px-4 py-3">الإجمالي</th>
                  <th className="whitespace-nowrap px-4 py-3">المدفوع</th>
                  <th className="whitespace-nowrap px-4 py-3">المتبقي</th>
                  <th className="whitespace-nowrap px-4 py-3">الفاتورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentServices.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{record.date} {record.time}</td>
                    <td className="whitespace-nowrap px-4 py-3">{record.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{getCustomerStatusLabel(record.customerStatus)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{record.phone || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(record.chickenCount, true)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{getServiceLabels(record)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-black text-teal-700 dark:text-teal-300">{formatCurrency(record.totalAmount, settings.currency)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatCurrency(record.paidAmount, settings.currency)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatCurrency(record.remainingAmount, settings.currency)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button type="button" className="app-button-secondary h-9 w-9 px-0" onClick={() => setSelectedInvoice(record)} title="عرض الفاتورة">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!recentServices.length && (
            <div className="px-4 py-10 text-center text-sm font-semibold text-stone-500 dark:text-stone-400">
              لا توجد خدمات ذبح محفوظة بعد.
            </div>
          )}
        </div>
      </section>

      <InvoiceModal record={selectedInvoice} settings={settings} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}
