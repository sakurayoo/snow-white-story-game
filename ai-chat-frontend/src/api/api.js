const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5114/api';

export class RateLimitError extends Error {
  constructor(waitSeconds) {
    super('rate_limit');
    this.waitSeconds = waitSeconds;
  }
}

// Parse "17m34.08s" or "45.6s" from a Groq error message
function parseWaitSeconds(msg) {
  const mMatch = msg.match(/(\d+)m\s*([\d.]+)s/);
  if (mMatch) return parseInt(mMatch[1], 10) * 60 + parseFloat(mMatch[2]);
  const sMatch = msg.match(/([\d.]+)s/);
  if (sMatch) return parseFloat(sMatch[1]);
  return 120;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // Backend properly returned 429
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    throw new RateLimitError(data.waitSeconds ?? 120);
  }

  const json = await res.json();
  if (!json.success) {
    const msg = json.message || '請求失敗';
    // Rate limit leaked as 500 (backend not restarted / fallback)
    if (msg.includes('TooManyRequests') || msg.includes('rate_limit_exceeded')) {
      throw new RateLimitError(parseWaitSeconds(msg));
    }
    throw new Error(msg);
  }
  return json.data;
}

export const api = {
  getConversations: () => request('/conversations'),
  createConversation: (title = '新對話') =>
    request('/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  deleteConversation: (id) =>
    request(`/conversations/${id}`, { method: 'DELETE' }),
  getMessages: (id) => request(`/conversations/${id}/messages`),
  sendMessage: (id, content) =>
    request(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
