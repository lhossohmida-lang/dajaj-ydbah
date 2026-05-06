import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const AI_MODEL = process.env.AI_MODEL || 'gemma4:e2b';
const MESSAGE_LIMIT = 2000;
const HISTORY_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 60000;

const SYSTEM_PROMPT =
  'أنت مساعد ذكي متخصص في إدارة مدبحة دجاج. وظيفتك مساعدة صاحب المدبحة في حساب الربح، الخسارة، المبيعات، تكلفة الدجاج الحي، تكلفة الذبح، العمال، الكهرباء، النقل، المخزون، الفواتير، الزبائن، وتقديم نصائح عملية لتحسين الربح. أجب بالعربية البسيطة أو الدارجة الجزائرية حسب لغة المستخدم. لا تخترع أرقامًا غير موجودة. إذا احتجت بيانات، اطلبها من المستخدم بوضوح. عندما تعطي حسابات، اشرح العملية خطوة بخطوة وباختصار. لا تقم بتعديل أو حذف بيانات التطبيق، فقط قدّم اقتراحات وتحليلات.';

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
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
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

function normalizeOllamaModelName(model) {
  return model?.name || model?.model || '';
}

async function getOllamaStatus() {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      return {
        online: false,
        modelInstalled: false,
        model: AI_MODEL,
        error: 'Ollama غير مشغل. شغله بالأمر: ollama serve',
      };
    }

    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];
    const modelInstalled = models.some((model) => normalizeOllamaModelName(model) === AI_MODEL);

    if (!modelInstalled) {
      return {
        online: true,
        modelInstalled: false,
        model: AI_MODEL,
        error: `النموذج غير مثبت. ثبته بالأمر: ollama pull ${AI_MODEL}`,
      };
    }

    return {
      online: true,
      modelInstalled: true,
      model: AI_MODEL,
    };
  } catch {
    return {
      online: false,
      modelInstalled: false,
      model: AI_MODEL,
      error: 'Ollama غير مشغل. شغله بالأمر: ollama serve',
    };
  }
}

function sanitizeBusinessContext(context = {}) {
  const allowedFields = [
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

  return allowedFields.reduce((summary, field) => {
    if (context[field] !== undefined && context[field] !== null && context[field] !== '') {
      summary[field] = context[field];
    }

    return summary;
  }, {});
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
    'هذه بيانات مختصرة من تطبيق إدارة مدبحة الدجاج. لا تعتبرها قاعدة بيانات كاملة، ولا تطلب تعديل البيانات.',
    `ملخص البيانات المتاحة: ${JSON.stringify(businessContext, null, 2)}`,
    `سؤال المستخدم: ${message}`,
  ].join('\n\n');
}

app.get('/api/ai/status', async (_request, response) => {
  const status = await getOllamaStatus();
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

  const status = await getOllamaStatus();

  if (!status.online) {
    return jsonError(response, 503, status.error, status);
  }

  if (!status.modelInstalled) {
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
    const ollamaResponse = await fetchWithTimeout(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      return jsonError(response, 502, 'تعذر الحصول على رد من Ollama. تأكد من تشغيله ومن تثبيت النموذج.');
    }

    const data = await ollamaResponse.json();
    const reply = data?.message?.content;

    if (!reply) {
      return jsonError(response, 502, 'وصل رد فارغ من Ollama.');
    }

    return response.json({ reply });
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    return jsonError(
      response,
      503,
      isTimeout
        ? 'استغرق Ollama وقتًا طويلًا في الرد. حاول مرة أخرى.'
        : 'Ollama غير مشغل أو لا يمكن الوصول إليه. شغله بالأمر: ollama serve',
    );
  }
});

app.use((_request, response) => {
  response.status(404).json({ error: 'المسار غير موجود.' });
});

app.listen(PORT, () => {
  console.log(`AI backend is running on http://localhost:${PORT}`);
});
