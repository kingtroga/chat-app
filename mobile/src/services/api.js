import { API_URL } from '../config';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Check your connection.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const fetchMessages = () => request('/api/messages');

export const sendMessage = (username, text) =>
  request('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ username, text }),
  });
