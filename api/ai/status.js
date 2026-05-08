import { applyCors, getAIStatus } from './_shared.js';

export default function handler(request, response) {
  if (!applyCors(request, response)) {
    return;
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET, OPTIONS');
    response.status(405).json({ error: 'هذه العملية غير مسموحة لهذا المسار.' });
    return;
  }

  const status = getAIStatus();
  response.status(status.online ? 200 : 503).json(status);
}
