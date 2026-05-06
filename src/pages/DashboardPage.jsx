import { Link } from 'react-router-dom';
import { Download, PlusCircle } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import StatsGrid from '../components/StatsGrid.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { aggregateSlaughters } from '../utils/calculations.js';
import { filterByPeriod } from '../utils/dateUtils.js';
import { exportToCsv } from '../utils/csv.js';

export default function DashboardPage() {
  const { settings } = useSettings();
  const { slaughters, loading, error } = useSlaughters();
  const todayStats = aggregateSlaughters(filterByPeriod(slaughters, 'today'));
  const monthStats = aggregateSlaughters(filterByPeriod(slaughters, 'month'));

  if (loading) {
    return <LoadingScreen label="جاري تحميل لوحة التحكم..." />;
  }

  function exportDashboard() {
    exportToCsv('dashboard-summary.csv', [
      { الفترة: 'اليوم', ...todayStats },
      { الفترة: 'الشهر', ...monthStats },
    ]);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">ملخص الأداء</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">إحصائيات اليوم والشهر بناءً على العمليات المحفوظة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="app-button-secondary" onClick={exportDashboard}>
            <Download className="h-4 w-4" />
            تصدير CSV
          </button>
          <Link to="/slaughters/new" className="app-button-primary">
            <PlusCircle className="h-4 w-4" />
            عملية جديدة
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} />

      <section className="space-y-4">
        <div>
          <h4 className="text-lg font-black">إحصائيات اليوم</h4>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">عمليات اليوم الحالي فقط.</p>
        </div>
        <StatsGrid stats={todayStats} currency={settings.currency} />
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-lg font-black">إحصائيات الشهر</h4>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">كل عمليات الشهر الحالي.</p>
        </div>
        <StatsGrid stats={monthStats} currency={settings.currency} />
      </section>
    </div>
  );
}
