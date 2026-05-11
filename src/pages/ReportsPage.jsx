import { useMemo, useState } from 'react';
import { Banknote, CalendarClock, ClipboardList, Download, Weight } from 'lucide-react';
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
import StatCard from '../components/StatCard.jsx';
import StatsGrid from '../components/StatsGrid.jsx';
import { useCustomerSlaughterServices } from '../hooks/useCustomerSlaughterServices.js';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { aggregateSlaughters } from '../utils/calculations.js';
import { aggregateCustomerSlaughterServices } from '../utils/customerSlaughterCalculations.js';
import { exportToCsv } from '../utils/csv.js';
import { filterByPeriod, groupByDay } from '../utils/dateUtils.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

const reportLabels = {
  today: 'تقرير يومي',
  week: 'تقرير أسبوعي',
  month: 'تقرير شهري',
};

function buildChartData(rows, serviceRows) {
  const grouped = groupByDay(rows);
  const groupedServices = groupByDay(serviceRows);
  const dates = Array.from(new Set([...Object.keys(grouped), ...Object.keys(groupedServices)]));

  return dates
    .sort((firstDate, secondDate) => firstDate.localeCompare(secondDate))
    .map((date) => {
      const stats = aggregateSlaughters(grouped[date] || []);
      const serviceStats = aggregateCustomerSlaughterServices(groupedServices[date] || []);
      return {
        date,
        الربح: stats.netProfit,
        المداخيل: stats.revenue,
        المصاريف: stats.totalExpenses,
        الدجاج: stats.chickenCount,
        'أرباح خدمة الذبح': serviceStats.serviceProfit,
        'دجاج الزبائن': serviceStats.chickenCount,
      };
    });
}

function buildReportCsv(period, stats, serviceStats, chartData) {
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
      'عدد خدمات ذبح الزبائن': serviceStats.serviceCount,
      'عدد دجاج الزبائن': serviceStats.chickenCount,
      'أرباح خدمة الذبح': serviceStats.serviceProfit,
      'مدفوعات خدمة الذبح': serviceStats.paidAmount,
      'متبقي خدمة الذبح': serviceStats.remainingAmount,
      'عدد أيام الرسم': chartData.length,
    },
  ];
}

export default function ReportsPage() {
  const { settings } = useSettings();
  const { slaughters, loading, error } = useSlaughters();
  const { services, loading: servicesLoading, error: servicesError } = useCustomerSlaughterServices();
  const [period, setPeriod] = useState('month');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const filteredRows = useMemo(() => filterByPeriod(slaughters, period), [slaughters, period]);
  const filteredServices = useMemo(() => filterByPeriod(services, period), [services, period]);
  const stats = useMemo(() => aggregateSlaughters(filteredRows), [filteredRows]);
  const serviceStats = useMemo(() => aggregateCustomerSlaughterServices(filteredServices), [filteredServices]);
  const chartData = useMemo(() => buildChartData(filteredRows, filteredServices), [filteredRows, filteredServices]);

  if (loading || servicesLoading) {
    return <LoadingScreen label="جاري تحميل التقارير..." />;
  }

  function handleExport() {
    const rows = buildReportCsv(period, stats, serviceStats, chartData);
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

      <ErrorMessage message={error || servicesError || message} tone={error || servicesError ? 'error' : messageTone} />

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

      <section className="space-y-4">
        <div>
          <h4 className="text-lg font-black">أرباح خدمة الذبح</h4>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            دخل مستقل من دجاج الزبائن لا ينقص المخزون، بإجمالي {formatCurrency(serviceStats.serviceProfit, settings.currency)}.
          </p>
        </div>
        <ServiceReportGrid stats={serviceStats} currency={settings.currency} />
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
              <Line type="monotone" dataKey="أرباح خدمة الذبح" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
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
              <Bar dataKey="أرباح خدمة الذبح" fill="#0284c7" radius={[6, 6, 0, 0]} />
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
              <Bar dataKey="دجاج الزبائن" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}

function ServiceReportGrid({ stats, currency }) {
  const cards = [
    { title: 'عدد خدمات الذبح', value: formatNumber(stats.serviceCount, true), icon: ClipboardList, tone: 'teal' },
    { title: 'دجاج الزبائن', value: formatNumber(stats.chickenCount, true), icon: Weight, tone: 'sky' },
    { title: 'أرباح خدمة الذبح', value: formatCurrency(stats.serviceProfit, currency), icon: Banknote, tone: 'emerald' },
    { title: 'المبالغ المدفوعة', value: formatCurrency(stats.paidAmount, currency), icon: Banknote, tone: 'teal' },
    { title: 'المبالغ المتبقية', value: formatCurrency(stats.remainingAmount, currency), icon: CalendarClock, tone: stats.remainingAmount > 0 ? 'amber' : 'stone' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
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
