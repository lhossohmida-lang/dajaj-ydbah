import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CircleAlert, Eraser, PlugZap, Send, Sparkles, User } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
import { useWorkers } from '../hooks/useWorkers.js';
import { checkAIStatus, sendAIMessage } from '../services/aiService.js';
import { aggregateSlaughters, toNumber } from '../utils/calculations.js';
import { filterByPeriod } from '../utils/dateUtils.js';
import { formatCurrency, formatKg, formatNumber, formatPercent } from '../utils/formatters.js';

const suggestions = [
  'احسب ربح اليوم',
  'لخص لي المبيعات',
  'هل عندي خسارة اليوم؟',
  'ما هو أفضل سعر بيع للكيلوغرام؟',
  'أعطني نصائح لتقليل المصاريف',
  'كم بقي في المخزون؟',
  'كم أخذ كل عامل من سلفة؟',
  'حلل لي الفواتير',
];

const appKnowledge = {
  appName: 'إدارة مدبحة الدجاج',
  language: 'العربية مع دعم الدارجة الجزائرية',
  pages: [
    'لوحة التحكم: إحصائيات اليوم والشهر',
    'إضافة عملية ذبح: معلومات عامة ثم معلومات الدجاج ثم المصاريف',
    'السجلات: بحث وفلترة وتفاصيل وتعديل وحذف وتصدير CSV',
    'التقارير: يومي وأسبوعي وشهري مع رسوم بيانية',
    'العمال: تسجيل العمال الدائمين وأجرهم الافتراضي',
    'الإعدادات: اسم المدبحة والعملة والأسعار الافتراضية',
    'الذكاء الاصطناعي: تحليل واقتراحات فقط بدون تعديل البيانات',
  ],
  firestoreCollections: [
    'users/{userId}/slaughters/{slaughterId}',
    'users/{userId}/workers/{workerId}',
    'users/{userId}/settings/app',
  ],
  calculations: {
    totalLiveWeight: 'عدد الدجاج × الوزن المتوسط حي',
    purchaseCost: 'الوزن الحي الكلي × سعر شراء الكيلو حي',
    netWeight: 'الوزن الحي الكلي × نسبة التصافي ÷ 100',
    revenue: 'الوزن الصافي × سعر بيع الكيلو صافي',
    extraExpenses: 'العمال + الكهرباء والماء + النقل + التغليف + التنظيف + الخسائر + أخرى',
    totalExpenses: 'تكلفة الشراء + المصاريف الإضافية',
    netProfit: 'المداخيل - إجمالي المصاريف',
    profitMargin: 'الربح الصافي ÷ المداخيل × 100',
  },
};

function summarizeExpenses(rows) {
  return rows.reduce(
    (summary, row) => ({
      purchaseCost: summary.purchaseCost + toNumber(row.purchaseCost),
      laborCost: summary.laborCost + toNumber(row.laborCost),
      transportCost: summary.transportCost + toNumber(row.transportCost),
      electricityCost: summary.electricityCost + toNumber(row.waterElectricityCost),
      otherExpenses:
        summary.otherExpenses +
        toNumber(row.packagingCost) +
        toNumber(row.cleaningCost) +
        toNumber(row.lossesCost) +
        toNumber(row.otherCost),
    }),
    {
      purchaseCost: 0,
      laborCost: 0,
      transportCost: 0,
      electricityCost: 0,
      otherExpenses: 0,
    },
  );
}

function operationSummary(row) {
  return {
    date: row.date,
    supplierName: row.supplierName,
    chickenCount: row.chickenCount,
    totalLiveWeight: row.totalLiveWeight,
    netWeight: row.netWeight,
    purchaseCost: row.purchaseCost,
    revenue: row.revenue,
    totalExpenses: row.totalExpenses,
    netProfit: row.netProfit,
    profitMargin: row.profitMargin,
    laborCost: row.laborCost,
    transportCost: row.transportCost,
    electricityCost: row.waterElectricityCost,
    workers: Array.isArray(row.workers)
      ? row.workers.map((worker) => ({
          name: worker.name,
          salary: worker.salary,
          advance: worker.advance || 0,
          remainingSalary: worker.remainingSalary ?? toNumber(worker.salary) - toNumber(worker.advance),
        }))
      : [],
  };
}

function buildWorkerLedger(rows, registeredWorkers = []) {
  const ledger = new Map();

  registeredWorkers.forEach((worker) => {
    ledger.set(worker.id || worker.name, {
      workerId: worker.id || '',
      name: worker.name,
      defaultSalary: worker.defaultSalary || 0,
      totalSalary: 0,
      totalAdvance: 0,
      remainingSalary: 0,
      operationCount: 0,
      lastOperationDate: '',
    });
  });

  rows.forEach((row) => {
    if (!Array.isArray(row.workers)) {
      return;
    }

    row.workers.forEach((worker) => {
      const key = worker.workerId || worker.name;

      if (!key) {
        return;
      }

      const current =
        ledger.get(key) ||
        {
          workerId: worker.workerId || '',
          name: worker.name,
          defaultSalary: 0,
          totalSalary: 0,
          totalAdvance: 0,
          remainingSalary: 0,
          operationCount: 0,
          lastOperationDate: '',
        };

      current.name = current.name || worker.name;
      current.totalSalary += toNumber(worker.salary);
      current.totalAdvance += toNumber(worker.advance);
      current.remainingSalary += toNumber(worker.salary) - toNumber(worker.advance);
      current.operationCount += 1;
      current.lastOperationDate = row.date || current.lastOperationDate;
      ledger.set(key, current);
    });
  });

  return Array.from(ledger.values()).map((worker) => ({
    ...worker,
    totalSalary: Math.round(worker.totalSalary * 100) / 100,
    totalAdvance: Math.round(worker.totalAdvance * 100) / 100,
    remainingSalary: Math.round(worker.remainingSalary * 100) / 100,
  }));
}

function buildBusinessContext(allRows, registeredWorkers, settings) {
  const todayRows = filterByPeriod(allRows, 'today');
  const monthRows = filterByPeriod(allRows, 'month');
  const todayStats = aggregateSlaughters(todayRows);
  const monthStats = aggregateSlaughters(monthRows);
  const allTimeStats = aggregateSlaughters(allRows);
  const todayExpenses = summarizeExpenses(todayRows);
  const monthExpenses = summarizeExpenses(monthRows);

  return {
    appKnowledge,
    settings: {
      slaughterhouseName: settings.slaughterhouseName,
      currency: settings.currency,
      defaultYieldPercentage: settings.defaultYieldPercentage,
      defaultNetKgSalePrice: settings.defaultNetKgSalePrice,
      defaultLiveKgPurchasePrice: settings.defaultLiveKgPurchasePrice,
    },
    today: {
      slaughteredChickenCount: todayStats.chickenCount,
      totalWeightKg: todayStats.netWeight,
      purchaseCost: todayExpenses.purchaseCost,
      laborCost: todayExpenses.laborCost,
      transportCost: todayExpenses.transportCost,
      electricityCost: todayExpenses.electricityCost,
      otherExpenses: todayExpenses.otherExpenses,
      salesTotal: todayStats.revenue,
      slaughterCount: todayStats.slaughterCount,
      netProfit: todayStats.netProfit,
      profitMargin: todayStats.profitMargin,
    },
    month: {
      slaughteredChickenCount: monthStats.chickenCount,
      totalWeightKg: monthStats.netWeight,
      purchaseCost: monthExpenses.purchaseCost,
      laborCost: monthExpenses.laborCost,
      transportCost: monthExpenses.transportCost,
      electricityCost: monthExpenses.electricityCost,
      otherExpenses: monthExpenses.otherExpenses,
      salesTotal: monthStats.revenue,
      slaughterCount: monthStats.slaughterCount,
      netProfit: monthStats.netProfit,
      profitMargin: monthStats.profitMargin,
    },
    allTime: {
      slaughteredChickenCount: allTimeStats.chickenCount,
      totalWeightKg: allTimeStats.netWeight,
      salesTotal: allTimeStats.revenue,
      totalExpenses: allTimeStats.totalExpenses,
      netProfit: allTimeStats.netProfit,
      profitMargin: allTimeStats.profitMargin,
      slaughterCount: allTimeStats.slaughterCount,
    },
    registeredWorkers: registeredWorkers.map((worker) => ({
      name: worker.name,
      defaultSalary: worker.defaultSalary || 0,
      notes: worker.notes || '',
    })),
    workersLedgerAllTime: buildWorkerLedger(allRows, registeredWorkers),
    workersLedgerToday: buildWorkerLedger(todayRows, registeredWorkers),
    todayOperations: todayRows.slice(0, 30).map(operationSummary),
    recentOperations: allRows.slice(0, 30).map(operationSummary),
    todaySlaughtered: todayStats.chickenCount,
    totalWeightKg: todayStats.netWeight,
    purchaseCost: todayExpenses.purchaseCost,
    laborCost: todayExpenses.laborCost,
    transportCost: todayExpenses.transportCost,
    electricityCost: todayExpenses.electricityCost,
    otherExpenses: todayExpenses.otherExpenses,
    salesTotal: todayStats.revenue,
    remainingStockKg: null,
    slaughterCount: todayStats.slaughterCount,
    netProfit: todayStats.netProfit,
    profitMargin: todayStats.profitMargin,
    currency: settings.currency,
  };
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          isUser
            ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200'
            : 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div
        className={`max-w-[min(760px,calc(100%-3rem))] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-7 shadow-sm ${
          isUser
            ? 'bg-teal-700 text-white'
            : 'border border-stone-200 bg-white text-stone-800 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { settings } = useSettings();
  const { slaughters, loading } = useSlaughters();
  const { workers, loading: workersLoading } = useWorkers();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'مرحبًا، أنا مساعد المدبحة الذكي. اسألني عن الربح، المصاريف، سعر البيع، العمال، أو تحليل اليوم.',
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const businessContext = useMemo(() => buildBusinessContext(slaughters, workers, settings), [slaughters, workers, settings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    handleCheckStatus();
  }, []);

  async function handleCheckStatus() {
    try {
      setStatusLoading(true);
      setError('');
      const nextStatus = await checkAIStatus();
      setStatus(nextStatus);

      if (!nextStatus.online || nextStatus.modelInstalled === false) {
        setError(nextStatus.error || 'خدمة الذكاء الاصطناعي غير جاهزة.');
      }
    } catch (statusError) {
      const message = statusError.message || 'تعذر فحص اتصال الذكاء الاصطناعي.';
      setStatus({
        online: false,
        provider: 'openrouter',
        model: 'nousresearch/hermes-3-llama-3.1-405b',
        error: message,
      });
      setError(message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleSend(customMessage) {
    const text = (customMessage || input).trim();

    if (!text) {
      setError('اكتب السؤال أولًا.');
      return;
    }

    if (text.length > 2000) {
      setError('السؤال طويل جدًا. اختصره قليلًا.');
      return;
    }

    const userMessage = { role: 'user', content: text };
    const chatHistory = messages
      .filter((message) => ['user', 'assistant'].includes(message.role))
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');

    try {
      setSending(true);
      const data = await sendAIMessage(text, businessContext, chatHistory);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
        },
      ]);
    } catch (sendError) {
      setError(sendError.message || 'تعذر إرسال السؤال إلى مساعد الذكاء الاصطناعي.');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'لم أستطع الرد الآن. تأكد أن مفتاح OpenRouter مضبوط في الخادم وأن النموذج متاح.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    setMessages([
      {
        role: 'assistant',
        content: 'تم مسح المحادثة. اطرح سؤالك الجديد عن المدبحة.',
      },
    ]);
    setError('');
  }

  if (loading || workersLoading) {
    return <LoadingScreen label="جاري تجهيز بيانات الذكاء الاصطناعي..." />;
  }

  const isAIReady = Boolean(status?.online && status?.modelInstalled !== false);
  const statusText = isAIReady
    ? `OpenRouter يعمل والنموذج ${status.model || 'Nous Hermes'} جاهز`
    : status?.error || 'لم يتم فحص الاتصال بعد';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">مساعد المدبحة الذكي</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            محادثة عبر Backend وسيط ثم OpenRouter. لا يتم إرسال قاعدة البيانات كاملة ولا يظهر المفتاح في الواجهة.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCheckStatus} disabled={statusLoading} className="app-button-secondary">
            <PlugZap className="h-4 w-4" />
            {statusLoading ? 'جاري الفحص...' : 'فحص اتصال الذكاء الاصطناعي'}
          </button>
          <button type="button" onClick={handleClear} className="app-button-secondary">
            <Eraser className="h-4 w-4" />
            مسح المحادثة
          </button>
        </div>
      </div>

      <section
        className={`rounded-lg border px-4 py-3 text-sm font-bold ${
          isAIReady
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4" />
          {statusText}
        </div>
      </section>

      <ErrorMessage message={error} />

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <article className="app-card flex min-h-[620px] flex-col overflow-hidden">
          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
            <p className="text-sm font-black">المحادثة</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">يدعم العربية والدارجة الجزائرية.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-stone-50 p-4 dark:bg-stone-900/40">
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}
            {sending && (
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: 'جاري التفكير في الأرقام...',
                }}
              />
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <div className="flex gap-2">
              <textarea
                className="app-input min-h-12 resize-none"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="اكتب سؤالك هنا..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button type="submit" disabled={sending} className="app-button-primary h-12 w-12 shrink-0 px-0" aria-label="إرسال">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </article>

        <aside className="space-y-4">
          <section className="app-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-700 dark:text-teal-300" />
              <h4 className="font-black">اقتراحات جاهزة</h4>
            </div>
            <div className="grid gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-right text-sm font-bold text-stone-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-teal-950/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          <section className="app-card p-4">
            <h4 className="font-black">ملخص بيانات اليوم المرسلة</h4>
            <dl className="mt-3 grid gap-2 text-sm">
              <SummaryItem label="عدد الدجاج" value={formatNumber(businessContext.today.slaughteredChickenCount, true)} />
              <SummaryItem label="الوزن الصافي" value={formatKg(businessContext.today.totalWeightKg)} />
              <SummaryItem label="المبيعات" value={formatCurrency(businessContext.today.salesTotal, settings.currency)} />
              <SummaryItem label="تكلفة الشراء" value={formatCurrency(businessContext.today.purchaseCost, settings.currency)} />
              <SummaryItem label="العمال" value={formatCurrency(businessContext.today.laborCost, settings.currency)} />
              <SummaryItem label="النقل" value={formatCurrency(businessContext.today.transportCost, settings.currency)} />
              <SummaryItem label="الكهرباء والماء" value={formatCurrency(businessContext.today.electricityCost, settings.currency)} />
              <SummaryItem label="سلف العمال اليوم" value={formatCurrency(businessContext.workersLedgerToday.reduce((total, worker) => total + toNumber(worker.totalAdvance), 0), settings.currency)} />
              <SummaryItem label="الربح الصافي" value={formatCurrency(businessContext.today.netProfit, settings.currency)} />
              <SummaryItem label="هامش الربح" value={formatPercent(businessContext.today.profitMargin)} />
            </dl>
          </section>
        </aside>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 dark:bg-stone-900">
      <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}
