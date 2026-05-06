import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatKg, formatNumber, formatPercent } from '../utils/formatters.js';

export default function RecordsTable({ rows, currency, onView, onDelete }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-right text-sm dark:divide-stone-800">
          <thead className="bg-stone-50 text-xs font-black uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">التاريخ</th>
              <th className="whitespace-nowrap px-4 py-3">اسم المورد</th>
              <th className="whitespace-nowrap px-4 py-3">عدد الدجاج</th>
              <th className="whitespace-nowrap px-4 py-3">الوزن الصافي</th>
              <th className="whitespace-nowrap px-4 py-3">المداخيل</th>
              <th className="whitespace-nowrap px-4 py-3">المصاريف</th>
              <th className="whitespace-nowrap px-4 py-3">الربح الصافي</th>
              <th className="whitespace-nowrap px-4 py-3">هامش الربح</th>
              <th className="whitespace-nowrap px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/70">
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{row.date}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.supplierName}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatNumber(row.chickenCount, true)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatKg(row.netWeight)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatCurrency(row.revenue, currency)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatCurrency(row.totalExpenses, currency)}</td>
                <td
                  className={`whitespace-nowrap px-4 py-3 font-black ${
                    Number(row.netProfit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(row.netProfit, currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatPercent(row.profitMargin)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onView(row)} className="app-button-secondary h-9 w-9 px-0" title="عرض التفاصيل">
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link to={`/slaughters/${row.id}/edit`} className="app-button-secondary h-9 w-9 px-0" title="تعديل">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button type="button" onClick={() => onDelete(row)} className="app-button-danger h-9 w-9 px-0" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="px-4 py-10 text-center text-sm font-semibold text-stone-500 dark:text-stone-400">
          لا توجد عمليات مطابقة للفلاتر الحالية.
        </div>
      )}
    </div>
  );
}
