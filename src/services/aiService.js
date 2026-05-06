const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:5000';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.');
  }

  return data;
}

export async function checkAIStatus() {
  const response = await fetch(`${AI_BACKEND_URL}/api/ai/status`);
  return parseResponse(response);
}

export async function sendAIMessage(message, businessContext, history) {
  const response = await fetch(`${AI_BACKEND_URL}/api/ai/chat`, {
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
