import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'nousresearch/hermes-3-llama-3.1-405b';
const OPENROUTER_REFERER = process.env.OPENROUTER_HTTP_REFERER || process.env.FRONTEND_URL || 'http://localhost:3000';
const OPENROUTER_TITLE = process.env.OPENROUTER_APP_TITLE || 'Dajaj Ydbah Slaughterhouse App';
const MESSAGE_LIMIT = 2000;
const HISTORY_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 90000;
const CONTEXT_LIMIT = 18000;
const RAW_CONTEXT_LIMIT = 50000;

const SYSTEM_PROMPT =
  'أنت مساعد ذكي متخصص في إدارة مدبحة دجاج. وظيفتك مساعدة صاحب المدبحة في حساب الربح، الخسارة، المبيعات، تكلفة الدجاج الحي، تكلفة الذبح، العمال، الكهرباء، النقل، المخزون، الفواتير، الزبائن، وتقديم نصائح عملية لتحسين الربح. ستستقبل أيضًا خريطة مختصرة عن صفحات التطبيق وبنية البيانات والحسابات، وملخصات آمنة عن العمليات والعمال والسلف. أجب بالعربية البسيطة أو الدارجة الجزائرية حسب لغة المستخدم. لا تخترع أرقامًا غير موجودة. إذا احتجت بيانات غير موجودة في السياق، قل بوضوح أنها غير متوفرة واطلبها. عندما تعطي حسابات، اشرح العملية خطوة بخطوة وباختصار. لا تقم بتعديل أو حذف بيانات التطبيق، فقط قدّم اقتراحات وتحليلات.';

function splitOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set([
  ...splitOrigins(process.env.FRONTEND_URL),
  ...splitOrigins(process.env.ALLOWED_FRONTEND_URLS),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://dajaj-ydbah.web.app',
  'https://dajaj-ydbah.firebaseapp.com',
  'https://dajaj-ydbah.vercel.app',
]);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('غير مسموح لهذا الموقع باستعمال Backend الذكاء الاصطناعي.'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(express.json({ limit: '64kb' }));

app.get('/api/ai/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'dajaj-ydbah-ai-backend',
    provider: AI_PROVIDER,
    model: AI_MODEL,
  });
});

function jsonError(response, status, message, details = {}) {
  return response.status(status).json({
    error: message,
    ...details,
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getAIStatus() {
  if (AI_PROVIDER !== 'openrouter') {
    return {
      online: false,
      provider: AI_PROVIDER,
      model: AI_MODEL,
      error: 'مزود الذكاء الاصطناعي غير مدعوم. استعمل AI_PROVIDER=openrouter في server/.env',
    };
  }

  if (!OPENROUTER_API_KEY.trim()) {
    return {
      online: false,
      provider: 'openrouter',
      model: AI_MODEL,
      error: 'OpenRouter API Key غير موجود. أضفه في server/.env',
    };
  }

  return {
    online: true,
    provider: 'openrouter',
    model: AI_MODEL,
  };
}

function sanitizeBusinessContext(context = {}) {
  const allowedTopLevelFields = [
    'appKnowledge',
    'settings',
    'today',
    'month',
    'allTime',
    'registeredWorkers',
    'workersLedgerAllTime',
    'workersLedgerToday',
    'todayOperations',
    'recentOperations',
    'todaySlaughtered',
    'totalWeightKg',
    'purchaseCost',
    'laborCost',
    'transportCost',
    'electricityCost',
    'otherExpenses',
    'salesTotal',
    'remainingStockKg',
    'slaughterCount',
    'netProfit',
    'profitMargin',
    'currency',
  ];

  const summary = allowedTopLevelFields.reduce((result, field) => {
    if (context[field] !== undefined && context[field] !== null && context[field] !== '') {
      result[field] = context[field];
    }

    return result;
  }, {});

  const serialized = JSON.stringify(summary);

  if (serialized.length <= CONTEXT_LIMIT) {
    return summary;
  }

  return {
    ...summary,
    recentOperations: Array.isArray(summary.recentOperations) ? summary.recentOperations.slice(0, 10) : summary.recentOperations,
    todayOperations: Array.isArray(summary.todayOperations) ? summary.todayOperations.slice(0, 15) : summary.todayOperations,
    contextNotice: 'تم تقليص عدد العمليات المرسلة لتفادي إرسال بيانات كثيرة إلى الذكاء الاصطناعي.',
  };
}

function sanitizeHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .slice(-HISTORY_LIMIT)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MESSAGE_LIMIT),
    }));
}

function buildUserContent(message, businessContext) {
  return [
    'هذه خريطة معرفة وبيانات مختصرة من تطبيق إدارة مدبحة الدجاج. لا تعتبرها قاعدة بيانات كاملة، ولا تطلب تعديل البيانات.',
    'إذا سأل المستخدم عن عامل أو سلفة، استعمل workersLedgerAllTime و workersLedgerToday و todayOperations و recentOperations.',
    `ملخص البيانات المتاحة: ${JSON.stringify(businessContext, null, 2)}`,
    `سؤال المستخدم: ${message}`,
  ].join('\n\n');
}

function getOpenRouterError(status, data) {
  const providerMessage = data?.error?.message || data?.message || '';

  if (status === 401 || status === 403) {
    return 'OpenRouter API Key غير صحيح أو لا يملك صلاحية. تأكد من المفتاح داخل server/.env';
  }

  if (status === 402 || status === 429) {
    return 'رصيد OpenRouter انتهى أو تم تجاوز الحد المسموح. راجع حساب OpenRouter ثم حاول مرة أخرى.';
  }

  if (status === 404) {
    return `النموذج ${AI_MODEL} غير متاح في OpenRouter. جرّب النسخة المجانية بإضافة :free إذا كانت متاحة.`;
  }

  if (status >= 500) {
    return 'خدمة OpenRouter تواجه مشكلة مؤقتة. حاول مرة أخرى بعد قليل.';
  }

  return providerMessage || 'تعذر الحصول على رد من OpenRouter. تحقق من الإعدادات وحاول مرة أخرى.';
}

app.get('/api/ai/status', (_request, response) => {
  const status = getAIStatus();
  response.status(status.online ? 200 : 503).json(status);
});

app.post('/api/ai/chat', async (request, response) => {
  const { message, businessContext = {}, history = [] } = request.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return jsonError(response, 400, 'السؤال مطلوب ويجب أن يكون نصًا غير فارغ.');
  }

  if (message.length > MESSAGE_LIMIT) {
    return jsonError(response, 400, `السؤال طويل جدًا. الحد الأقصى هو ${MESSAGE_LIMIT} حرف.`);
  }

  const rawContextSize = JSON.stringify(businessContext).length;

  if (rawContextSize > RAW_CONTEXT_LIMIT) {
    return jsonError(response, 400, 'ملخص بيانات التطبيق كبير جدًا. أرسل ملخصًا أصغر بدل قاعدة البيانات كاملة.');
  }

  const status = getAIStatus();

  if (!status.online) {
    return jsonError(response, 503, status.error, status);
  }

  const safeBusinessContext = sanitizeBusinessContext(businessContext);
  const safeHistory = sanitizeHistory(history);
  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    ...safeHistory,
    {
      role: 'user',
      content: buildUserContent(message.trim(), safeBusinessContext),
    },
  ];

  try {
    const aiResponse = await fetchWithTimeout(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-Title': OPENROUTER_TITLE,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.3,
      }),
    });

    const data = await aiResponse.json().catch(() => ({}));

    if (!aiResponse.ok) {
      return jsonError(response, aiResponse.status === 429 ? 429 : 502, getOpenRouterError(aiResponse.status, data), {
        provider: 'openrouter',
        model: AI_MODEL,
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return jsonError(response, 502, 'وصل رد فارغ من OpenRouter.', {
        provider: 'openrouter',
        model: AI_MODEL,
      });
    }

    return response.json({ reply });
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    return jsonError(
      response,
      503,
      isTimeout
        ? 'استغرق OpenRouter وقتًا طويلًا في الرد. حاول مرة أخرى.'
        : 'تعذر الاتصال بـ OpenRouter من الخادم. تحقق من الإنترنت وإعدادات server/.env',
      {
        provider: 'openrouter',
        model: AI_MODEL,
      },
    );
  }
});

app.use((error, _request, response, next) => {
  if (error?.type === 'entity.too.large') {
    return jsonError(response, 413, 'حجم الطلب كبير جدًا. لا ترسل قاعدة البيانات كاملة إلى الذكاء الاصطناعي.');
  }

  if (error?.message?.includes('غير مسموح')) {
    return jsonError(response, 403, error.message);
  }

  return next(error);
});

app.use((_request, response) => {
  response.status(404).json({ error: 'المسار غير موجود.' });
});

app.listen(PORT, () => {
  console.log(`AI backend is running on http://localhost:${PORT}`);
});
