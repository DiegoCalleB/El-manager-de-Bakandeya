import { Lead, Rehearsal, Concert, SocialPost, Payment, SocialMetric, Fan, User, Tour, EPKConfig, Message, GoogleSheetsStatus } from '../types';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bakandeya_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 409) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || 'Conflicto de sincronización con Google Sheets. Los datos han cambiado en paralelo.',
      409,
      errorData
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `Error en la petición HTTP (${response.status})`,
      response.status,
      errorData
    );
  }

  // Handle empty body responses (e.g., 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return {} as T;
}

export const api = {
  // Authentication
  async verifyMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(token: string): Promise<void> {
    await request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  // State Fetching
  async getState(): Promise<{
    leads: Lead[];
    rehearsals: Rehearsal[];
    concerts: Concert[];
    posts: SocialPost[];
    payments: Payment[];
    messages: Message[];
    metrics: SocialMetric[];
    users: User[];
    fans: Fan[];
    epkConfig: EPKConfig;
    tours?: Tour[];
  }> {
    return request('/api/state');
  },

  // Google Sheets Verification
  async checkSheets(): Promise<GoogleSheetsStatus> {
    return request('/api/check-sheets');
  },

  // EPK
  async updateEpkConfig(newConfig: Partial<EPKConfig>): Promise<EPKConfig> {
    return request('/api/epk-config', {
      method: 'PUT',
      body: JSON.stringify(newConfig)
    });
  },

  async updateIncentive(incentivoFans: NonNullable<EPKConfig['incentivoFans']>): Promise<{ ok: boolean }> {
    return request('/api/epk', {
      method: 'PUT',
      body: JSON.stringify({ incentivoFans })
    });
  },

  // Leads
  async createLead(lead: Lead): Promise<Lead> {
    return request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    });
  },

  async updateLead(id: string, updatedFields: Partial<Lead>, expectedStatus?: string): Promise<Lead> {
    return request(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updatedFields, expectedStatus })
    });
  },

  // Rehearsals
  async createRehearsal(rehearsal: Rehearsal): Promise<Rehearsal> {
    return request('/api/rehearsals', {
      method: 'POST',
      body: JSON.stringify(rehearsal)
    });
  },

  async updateRehearsal(id: string, updatedFields: Partial<Rehearsal>): Promise<Rehearsal> {
    return request(`/api/rehearsals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Concerts
  async createConcert(concert: Concert): Promise<Concert> {
    return request('/api/concerts', {
      method: 'POST',
      body: JSON.stringify(concert)
    });
  },

  async updateConcert(id: string, updatedFields: Partial<Concert>): Promise<Concert> {
    return request(`/api/concerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Social Posts
  async createPost(post: SocialPost): Promise<SocialPost> {
    return request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  },

  async updatePost(id: string, updatedFields: Partial<SocialPost>): Promise<SocialPost> {
    return request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Social Metrics
  async createMetric(metric: SocialMetric): Promise<SocialMetric> {
    return request('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(metric)
    });
  },

  async updateMetric(id: string, updatedFields: Partial<SocialMetric>): Promise<SocialMetric> {
    return request(`/api/metrics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  async deleteMetric(id: string): Promise<void> {
    return request(`/api/metrics/${id}`, {
      method: 'DELETE'
    });
  },

  // Payments / Finanzas
  async createPayment(payment: Payment): Promise<Payment> {
    return request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  },

  async updatePayment(id: string, updatedFields: Partial<Payment>): Promise<Payment> {
    return request(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Tours
  async createTour(tour: Tour): Promise<Tour> {
    return request('/api/tours', {
      method: 'POST',
      body: JSON.stringify(tour)
    });
  },

  async updateTour(id: string, tour: Tour): Promise<Tour> {
    return request(`/api/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tour)
    });
  },

  async deleteTour(id: string): Promise<void> {
    return request(`/api/tours/${id}`, {
      method: 'DELETE'
    });
  },

  // Fans
  async createFan(fan: Fan): Promise<Fan> {
    return request('/api/fans', {
      method: 'POST',
      body: JSON.stringify(fan)
    });
  },

  async deleteFan(id: string): Promise<void> {
    return request(`/api/fans/${id}`, {
      method: 'DELETE'
    });
  }
};
