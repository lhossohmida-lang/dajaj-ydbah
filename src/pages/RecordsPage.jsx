import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import RecordsTable from '../components/RecordsTable.jsx';
import SlaughterDetailsModal from '../components/SlaughterDetailsModal.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { deleteSlaughter } from '../services/slaughterService.js';
import { exportToCsv } from '../utils/csv.js';
import { filterByPeriod } from '../utils/dateUtils.js';

function buildCsvRows(rows) {
  return rows.map((row) => ({
    التاريخ: row.date,
    المورد: row.supplierName,
    العمال: Array.isArray(row.workers) ? row.workers.map((worker) => `${worker.name}: ${worker.salary}`).join(' | ') : '',
    'أجور العمال': row.laborCost,
    'عدد الدجاج': row.chickenCount,
    'الوزن الحي الكلي': row.totalLiveWeight,
    'الوزن الصافي': row.netWeight,
    المداخيل: row.revenue,
    المصاريف: row.totalExpenses,
    'الربح الصافي': row.netProfit,
    'هامش الربح': row.profitMargin,
    ملاحظات: row.notes,
  }));
}

export default function RecordsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { slaughters, loading, error } = useSlaughters();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [period, setPeriod] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionTone, setActionTone] = useState('info');

  const filteredRows = useMemo(() => {
    return filterByPeriod(slaughters, period).filter((row) => {
      const matchesSearch = row.supplierName?.toLowerCase().includes(search.trim().toLowerCase());
      const matchesDate = dateFilter ? row.date === dateFilter : true;
      return matchesSearch && matchesDate;
    });
  }, [slaughters, period, search, dateFilter]);

  async function handleDelete(row) {
    const confirmed = window.confirm(`هل تريد حذف عملية المورد "${row.supplierName}" بتاريخ ${row.date}؟`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteSlaughter(user.uid, row.id);
      setActionTone('success');
      setActionMessage('تم حذف العملية بنجاح.');
    } catch (deleteError) {
      setActionTone('error');
      setActionMessage(deleteError.message || 'تعذر حذف العملية.');
    }
  }

  function handleExport() {
    const exported = exportToCsv('slaughter-records.csv', buildCsvRows(filteredRows));
    setActionTone(exported ? 'success' : 'info');
    setActionMessage(exported ? 'تم تجهيز ملف CSV.' : 'لا توجد بيانات لتصديرها.');
  }

  if (loading) {
    return <LoadingScreen label="جاري تحميل السجلات..." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">سجلات عمليات الذبح</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">بحث وفلترة وتعديل وحذف مع تحديث مباشر من Firestore.</p>
        </div>
        <button type="button" onClick={handleExport} className="app-button-secondary">
          <Download className="h-4 w-4" />
          تصدير CSV
        </button>
      </div>

      <ErrorMessage message={error || actionMessage} tone={error ? 'error' : actionTone} />

      <section className="app-card p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
          <label className="relative block">
            <span className="app-label">البحث باسم المورد</span>
            <Search className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-stone-400" />
            <input
              type="search"
              className="app-input pr-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="اكتب اسم المورد"
            />
          </label>
          <label className="block">
            <span className="app-label">فلترة حسب التاريخ</span>
            <input type="date" className="app-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </label>
          <label className="block">
            <span className="app-label">الفترة</span>
            <select className="app-input" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="all">كل السجلات</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
            </select>
          </label>
        </div>
      </section>

      <RecordsTable rows={filteredRows} currency={settings.currency} onView={setSelectedRow} onDelete={handleDelete} />
      <SlaughterDetailsModal row={selectedRow} currency={settings.currency} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
