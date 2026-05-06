import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import StatsGrid from '../components/StatsGrid.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { aggregateSlaughters } from '../utils/calculations.js';
import { exportToCsv } from '../utils/csv.js';
import { filterByPeriod, groupByDay } from '../utils/dateUtils.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

const reportLabels = {
  today: 'تقرير يومي',
  week: 'تقرير أسبوعي',
  month: 'تقرير شهري',
};

function buildChartData(rows) {
  const grouped = groupByDay(rows);

  return Object.entries(grouped)
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, items]) => {
      const stats = aggregateSlaughters(items);
      return {
        date,
        الربح: stats.netProfit,
        المداخيل: stats.revenue,
        المصاريف: stats.totalExpenses,
        الدجاج: stats.chickenCount,
      };
    });
}

function buildReportCsv(period, stats, chartData) {
  return [
    {
      التقرير: reportLabels[period],
      'عدد عمليات الذبح': stats.slaughterCount,
      'مجموع عدد الدجاج': stats.chickenCount,
      'مجموع الوزن الصافي': stats.netWeight,
      'مجموع المداخيل': stats.revenue,
      'مجموع المصاريف': stats.totalExpenses,
      'مجموع الربح': stats.netProfit,
      'متوسط الربح لكل دجاجة': stats.profitPerChicken,
      'متوسط هامش الربح': stats.profitMargin,
      'عدد أيام الرسم': chartData.length,
    },
  ];
}

export default function ReportsPage() {
  const { settings } = useSettings();
  const { slaughters, loading, error } = useSlaughters();
  const [period, setPeriod] = useState('month');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const filteredRows = useMemo(() => filterByPeriod(slaughters, period), [slaughters, period]);
  const stats = useMemo(() => aggregateSlaughters(filteredRows), [filteredRows]);
  const chartData = useMemo(() => buildChartData(filteredRows), [filteredRows]);

  if (loading) {
    return <LoadingScreen label="جاري تحميل التقارير..." />;
  }

  function handleExport() {
    const rows = buildReportCsv(period, stats, chartData);
    const exported = exportToCsv(`report-${period}.csv`, rows);
    setMessageTone(exported ? 'success' : 'info');
    setMessage(exported ? 'تم تجهيز ملف التقرير بصيغة CSV.' : 'لا توجد بيانات لتصديرها.');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">التقارير</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">تقارير يومية وأسبوعية وشهرية مع رسوم بيانية تفاعلية.</p>
        </div>
        <button type="button" className="app-button-secondary" onClick={handleExport}>
          <Download className="h-4 w-4" />
          تصدير CSV
        </button>
      </div>

      <ErrorMessage message={error || message} tone={error ? 'error' : messageTone} />

      <section className="app-card p-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(reportLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={period === value ? 'app-button-primary' : 'app-button-secondary'}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-lg font-black">{reportLabels[period]}</h4>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            مجموع عدد الدجاج {formatNumber(stats.chickenCount, true)} ومتوسط الربح لكل دجاجة {formatCurrency(stats.profitPerChicken, settings.currency)}.
          </p>
        </div>
        <StatsGrid stats={stats} currency={settings.currency} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="الربح حسب الأيام">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="الربح" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="المداخيل مقابل المصاريف">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="المداخيل" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="المصاريف" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="عدد الدجاج حسب الأيام">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="الدجاج" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="app-card p-5">
      <h4 className="text-base font-black">{title}</h4>
      <div className="mt-4 h-[280px] min-w-0">{children}</div>
    </article>
  );
}
