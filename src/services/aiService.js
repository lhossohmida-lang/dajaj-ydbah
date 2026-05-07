function getDefaultAIBackendUrl() {
  if (import.meta.env.DEV) {
    return '';
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const { hostname, protocol } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }

  return 'http://localhost:5000';
}

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || getDefaultAIBackendUrl();

async function requestAI(path, options) {
  const url = `${AI_BACKEND_URL}${path}`;

  try {
    return await fetch(url, options);
  } catch {
    throw new Error('تعذر الاتصال بخادم الذكاء الاصطناعي. شغل Backend بالأمر: npm run server');
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.');
  }

  return data;
}

export async function checkAIStatus() {
  const response = await requestAI('/api/ai/status');
  return parseResponse(response);
}

export async function sendAIMessage(message, businessContext, history) {
  const response = await requestAI('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      businessContext,
      history,
    }),
  });

  return parseResponse(response);
}
