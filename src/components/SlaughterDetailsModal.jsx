import { X } from 'lucide-react';
import { formatCurrency, formatKg, formatNumber, formatPercent } from '../utils/formatters.js';

const details = [
  ['date', 'التاريخ'],
  ['supplierName', 'اسم المورد'],
  ['chickenCount', 'عدد الدجاج', 'number'],
  ['averageLiveWeight', 'الوزن المتوسط حي', 'kg'],
  ['liveKgPurchasePrice', 'سعر شراء الكيلو حي', 'currency'],
  ['yieldPercentage', 'نسبة التصافي', 'percent'],
  ['netKgSalePrice', 'سعر بيع الكيلو صافي', 'currency'],
  ['totalLiveWeight', 'الوزن الحي الكلي', 'kg'],
  ['purchaseCost', 'تكلفة الشراء', 'currency'],
  ['netWeight', 'الوزن الصافي', 'kg'],
  ['revenue', 'المداخيل', 'currency'],
  ['extraExpenses', 'إجمالي المصاريف الإضافية', 'currency'],
  ['totalExpenses', 'إجمالي المصاريف', 'currency'],
  ['netProfit', 'الربح الصافي', 'currency'],
  ['profitPerChicken', 'الربح لكل دجاجة', 'currency'],
  ['profitMargin', 'هامش الربح', 'percent'],
  ['breakEvenKgPrice', 'سعر التعادل للكيلو', 'currency'],
  ['breakEvenKg', 'نقطة التعادل بالكيلو', 'kg'],
  ['notes', 'ملاحظات'],
];

function formatValue(row, key, type, currency) {
  if (type === 'currency') {
    return formatCurrency(row[key], currency);
  }

  if (type === 'kg') {
    return formatKg(row[key]);
  }

  if (type === 'percent') {
    return formatPercent(row[key]);
  }

  if (type === 'number') {
    return formatNumber(row[key], true);
  }

  return row[key] || 'لا توجد ملاحظات';
}

export default function SlaughterDetailsModal({ row, currency, onClose }) {
  if (!row) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 px-4 py-6">
      <article className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft dark:border-stone-800 dark:bg-stone-950">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-black">تفاصيل العملية</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{row.supplierName} - {row.date}</p>
          </div>
          <button type="button" className="app-button-secondary h-9 w-9 px-0" onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {details.map(([key, label, type]) => (
              <div key={key} className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-400">{label}</p>
                <p className="mt-1 break-words text-sm font-black">{formatValue(row, key, type, currency)}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
