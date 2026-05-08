import { applyCors, askAI, parseBody } from './_shared.js';

export default async function handler(request, response) {
  if (!applyCors(request, response)) {
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(405).json({ error: 'هذه العملية غير مسموحة لهذا المسار.' });
    return;
  }

  const result = await askAI(parseBody(request));
  response.status(result.status).json(result.body);
}
