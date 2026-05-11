import { useMemo, useState } from 'react';
import { Banknote, CalendarClock, Phone, ReceiptText, Search, UserRound, Users, Weight } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import StatCard from '../components/StatCard.jsx';
import { useCustomerSlaughterServices } from '../hooks/useCustomerSlaughterServices.js';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { buildCustomers } from '../utils/customerRecords.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

function filterCustomers(customers, search) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return customers;
  }

  return customers.filter((customer) =>
    [customer.name, customer.phone].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)),
  );
}

function aggregateCustomers(customers) {
  return customers.reduce(
    (totals, customer) => ({
      customerCount: totals.customerCount + 1,
      transactionCount: totals.transactionCount + customer.transactionCount,
      chickenCount: totals.chickenCount + customer.chickenCount,
      totalAmount: totals.totalAmount + customer.totalAmount,
      paidAmount: totals.paidAmount + customer.paidAmount,
      remainingAmount: totals.remainingAmount + customer.remainingAmount,
    }),
    {
      customerCount: 0,
      transactionCount: 0,
      chickenCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
    },
  );
}

function CustomersSummary({ stats, currency }) {
  const cards = [
    { title: 'عدد الزبائن', value: formatNumber(stats.customerCount, true), icon: Users, tone: 'teal' },
    { title: 'عدد المعاملات', value: formatNumber(stats.transactionCount, true), icon: ReceiptText, tone: 'sky' },
    { title: 'عدد الدجاج', value: formatNumber(stats.chickenCount, true), icon: Weight, tone: 'amber' },
    { title: 'إجمالي المبالغ', value: formatCurrency(stats.totalAmount, currency), icon: Banknote, tone: 'emerald' },
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

export default function CustomersPage() {
  const { settings } = useSettings();
  const { services, loading: servicesLoading, error: servicesError } = useCustomerSlaughterServices();
  const { slaughters, loading: slaughtersLoading, error: slaughtersError } = useSlaughters();
  const [search, setSearch] = useState('');
  const customers = useMemo(() => buildCustomers(services, slaughters), [services, slaughters]);
  const filteredCustomers = useMemo(() => filterCustomers(customers, search), [customers, search]);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState('');
  const selectedCustomer = useMemo(() => {
    if (!filteredCustomers.length) {
      return null;
    }

    return filteredCustomers.find((customer) => customer.key === selectedCustomerKey) || filteredCustomers[0];
  }, [filteredCustomers, selectedCustomerKey]);
  const stats = useMemo(() => aggregateCustomers(filteredCustomers), [filteredCustomers]);

  if (servicesLoading || slaughtersLoading) {
    return <LoadingScreen label="جاري تحميل الزبائن..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">الزبائن</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">سجل الزبائن وكل معاملاتهم السابقة في مكان واحد.</p>
        </div>
      </div>

      <ErrorMessage message={servicesError || slaughtersError} tone="error" />

      <CustomersSummary stats={stats} currency={settings.currency} />

      <section className="app-card p-4">
        <label className="relative block">
          <span className="app-label">البحث عن زبون</span>
          <Search className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-stone-400" />
          <input
            type="search"
            className="app-input pr-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedCustomerKey('');
            }}
            placeholder="اكتب اسم الزبون أو رقم الهاتف"
          />
        </label>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <h4 className="text-lg font-black">قائمة الزبائن</h4>
          <div className="space-y-2">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.key}
                type="button"
                onClick={() => setSelectedCustomerKey(customer.key)}
                className={`w-full rounded-lg border p-4 text-right transition ${
                  selectedCustomer?.key === customer.key
                    ? 'border-teal-600 bg-teal-50 text-teal-950 dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-100'
                    : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{customer.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {customer.phone || 'لا يوجد رقم هاتف'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-stone-600 dark:text-stone-300">
                  <span>{formatNumber(customer.transactionCount, true)} معاملات</span>
                  <span>{formatCurrency(customer.totalAmount, settings.currency)}</span>
                </div>
              </button>
            ))}
          </div>
          {!filteredCustomers.length && (
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-10 text-center text-sm font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
              لا يوجد زبائن مطابقون للبحث الحالي.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-black">المعاملات السابقة</h4>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {selectedCustomer ? `${selectedCustomer.name} - ${formatNumber(selectedCustomer.transactionCount, true)} معاملات` : 'اختر زبونا من القائمة.'}
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-right text-sm dark:divide-stone-800">
                <thead className="bg-stone-50 text-xs font-black uppercase text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">التاريخ</th>
                    <th className="whitespace-nowrap px-4 py-3">نوع المعاملة</th>
                    <th className="whitespace-nowrap px-4 py-3">عدد الدجاج</th>
                    <th className="whitespace-nowrap px-4 py-3">الإجمالي</th>
                    <th className="whitespace-nowrap px-4 py-3">المدفوع</th>
                    <th className="whitespace-nowrap px-4 py-3">المتبقي</th>
                    <th className="whitespace-nowrap px-4 py-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {selectedCustomer?.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/70">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">{transaction.date} {transaction.time}</td>
                      <td className="whitespace-nowrap px-4 py-3">{transaction.type}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatNumber(transaction.chickenCount, true)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-black text-teal-700 dark:text-teal-300">{formatCurrency(transaction.totalAmount, settings.currency)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatCurrency(transaction.paidAmount, settings.currency)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatCurrency(transaction.remainingAmount, settings.currency)}</td>
                      <td className="min-w-52 px-4 py-3">{transaction.notes || 'لا توجد ملاحظات'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!selectedCustomer && (
              <div className="px-4 py-10 text-center text-sm font-semibold text-stone-500 dark:text-stone-400">
                لا توجد معاملات بعد.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
