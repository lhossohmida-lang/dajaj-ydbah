import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CircleAlert, Eraser, PlugZap, Send, Sparkles, User } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { useSlaughters } from '../hooks/useSlaughters.js';
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
  'حلل لي الفواتير',
];

function buildBusinessContext(todayRows, currency) {
  const todayStats = aggregateSlaughters(todayRows);
  const totals = todayRows.reduce(
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

  return {
    todaySlaughtered: todayStats.chickenCount,
    totalWeightKg: todayStats.netWeight,
    purchaseCost: totals.purchaseCost,
    laborCost: totals.laborCost,
    transportCost: totals.transportCost,
    electricityCost: totals.electricityCost,
    otherExpenses: totals.otherExpenses,
    salesTotal: todayStats.revenue,
    remainingStockKg: null,
    slaughterCount: todayStats.slaughterCount,
    netProfit: todayStats.netProfit,
    profitMargin: todayStats.profitMargin,
    currency,
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

  const todayRows = useMemo(() => filterByPeriod(slaughters, 'today'), [slaughters]);
  const businessContext = useMemo(() => buildBusinessContext(todayRows, settings.currency), [todayRows, settings.currency]);

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

      if (!nextStatus.online || !nextStatus.modelInstalled) {
        setError(nextStatus.error || 'خدمة الذكاء الاصطناعي غير جاهزة.');
      }
    } catch (statusError) {
      setStatus({
        online: false,
        modelInstalled: false,
        model: 'gemma4:e2b',
      });
      setError(statusError.message || 'تعذر فحص اتصال الذكاء الاصطناعي.');
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
          content: 'لم أستطع الرد الآن. تأكد أن Ollama يعمل وأن النموذج مثبت.',
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

  if (loading) {
    return <LoadingScreen label="جاري تجهيز بيانات الذكاء الاصطناعي..." />;
  }

  const statusText = status?.online
    ? status.modelInstalled
      ? `Ollama يعمل والنموذج ${status.model} جاهز`
      : status.error
    : status?.error || 'لم يتم فحص الاتصال بعد';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">مساعد المدبحة الذكي</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            محادثة محلية مجانية عبر Backend وسيط ثم Ollama. لا يتم إرسال قاعدة البيانات كاملة.
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
          status?.online && status?.modelInstalled
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
              <SummaryItem label="عدد الدجاج" value={formatNumber(businessContext.todaySlaughtered, true)} />
              <SummaryItem label="الوزن الصافي" value={formatKg(businessContext.totalWeightKg)} />
              <SummaryItem label="المبيعات" value={formatCurrency(businessContext.salesTotal, settings.currency)} />
              <SummaryItem label="تكلفة الشراء" value={formatCurrency(businessContext.purchaseCost, settings.currency)} />
              <SummaryItem label="العمال" value={formatCurrency(businessContext.laborCost, settings.currency)} />
              <SummaryItem label="النقل" value={formatCurrency(businessContext.transportCost, settings.currency)} />
              <SummaryItem label="الكهرباء والماء" value={formatCurrency(businessContext.electricityCost, settings.currency)} />
              <SummaryItem label="الربح الصافي" value={formatCurrency(businessContext.netProfit, settings.currency)} />
              <SummaryItem label="هامش الربح" value={formatPercent(businessContext.profitMargin)} />
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
