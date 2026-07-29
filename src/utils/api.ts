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
