// Centralized authenticated API fetch helper for Bakandeya App

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('bakandeya_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function safeJsonFetch<T = any>(res: Response, fallbackValue: T = {} as T): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${text.slice(0, 100) || res.statusText}`);
    }
    return fallbackValue;
  }
  return res.json().catch(() => fallbackValue);
}
