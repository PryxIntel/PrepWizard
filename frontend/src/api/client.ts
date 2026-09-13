const getApiBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    // Local development in browser
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
      return '/api';
    }
  }
  return 'https://priyanshuchauhan.in/api';
};

const API_BASE = getApiBase();

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('prepwizard_token');
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      // Offline fallback queue support for test sessions
      if (endpoint.includes('/answer') && options.method === 'POST') {
        this.queueOfflineAnswer(endpoint, options.body);
      }
      throw err;
    }
  }

  // Offline recovery queue
  private static queueOfflineAnswer(endpoint: string, body: any) {
    try {
      const queue = JSON.parse(localStorage.getItem('prepwizard_offline_queue') || '[]');
      queue.push({ endpoint, body, timestamp: Date.now() });
      localStorage.setItem('prepwizard_offline_queue', JSON.stringify(queue));
      console.warn('Network offline: Answer submission queued locally.');
    } catch (e) {
      console.error('Error queuing offline answer', e);
    }
  }

  public static async syncOfflineQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem('prepwizard_offline_queue') || '[]');
      if (queue.length === 0) return;

      console.log(`Syncing ${queue.length} offline answers...`);
      for (const item of queue) {
        await this.request(item.endpoint, { method: 'POST', body: item.body });
      }
      localStorage.removeItem('prepwizard_offline_queue');
      console.log('Offline queue synchronized successfully!');
    } catch (e) {
      console.error('Failed to sync offline queue:', e);
    }
  }

  // Auth APIs
  static login = (data: any) => this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  static register = (data: any) => this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  static getMe = () => this.request('/auth/me');
  static updateProfile = (data: any) => this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

  // Exam APIs
  static getExams = () => this.request('/exams');
  static getExam = (id: string) => this.request(`/exams/${id}`);

  // Session APIs
  static startSession = (data: any) => this.request('/sessions/start', { method: 'POST', body: JSON.stringify(data) });
  static getSessionState = (id: string) => this.request(`/sessions/${id}/state`);
  static submitAnswer = (id: string, data: any) => this.request(`/sessions/${id}/answer`, { method: 'POST', body: JSON.stringify(data) });
  static updateStatus = (id: string, data: any) => this.request(`/sessions/${id}/status`, { method: 'POST', body: JSON.stringify(data) });
  static submitTest = (id: string) => this.request(`/sessions/${id}/submit`, { method: 'POST' });
  static getPostExamAnalysis = (id: string) => this.request(`/sessions/${id}/analysis`);

  // Analytics APIs
  static getDashboardSummary = () => this.request('/analytics/dashboard');

  // Mistake Book APIs
  static getMistakes = (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return this.request(`/mistakes?${query}`);
  };
  static updateMistake = (id: string, data: any) => this.request(`/mistakes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  static deleteMistake = (id: string) => this.request(`/mistakes/${id}`, { method: 'DELETE' });

  // Bookmark APIs
  static getBookmarks = (category?: string) => {
    const q = category ? `?category=${category}` : '';
    return this.request(`/bookmarks${q}`);
  };
  static createBookmark = (data: any) => this.request('/bookmarks', { method: 'POST', body: JSON.stringify(data) });
  static deleteBookmark = (id: string) => this.request(`/bookmarks/${id}`, { method: 'DELETE' });

  // Revision APIs
  static getDueRevisions = () => this.request('/revisions/due');
  static submitReview = (data: any) => this.request('/revisions/review', { method: 'POST', body: JSON.stringify(data) });

  // AI Assistant APIs
  static explainQuestion = (questionId: string, tone = 'simple') => this.request(`/ai/explain/${questionId}?tone=${tone}`);
  static answerDoubt = (data: { questionId: string; userQuery: string }) => this.request('/ai/doubt', { method: 'POST', body: JSON.stringify(data) });
  static analyzeMistakes = () => this.request('/ai/analyze-mistakes');
  static getStudyPlan = () => this.request('/ai/study-plan');

  // Admin APIs
  static getAdminQuestions = (params: any = {}) => {
    const q = new URLSearchParams(params).toString();
    return this.request(`/admin/questions?${q}`);
  };
  static createAdminQuestion = (data: any) => this.request('/admin/questions', { method: 'POST', body: JSON.stringify(data) });
  static deleteAdminQuestion = (id: string) => this.request(`/admin/questions/${id}`, { method: 'DELETE' });
  static bulkImportQuestions = (questions: any[]) => this.request('/admin/questions/bulk', { method: 'POST', body: JSON.stringify({ questions }) });
  static updateExamPattern = (patternId: string, data: any) => this.request(`/admin/patterns/${patternId}`, { method: 'PUT', body: JSON.stringify(data) });
  static getSystemStats = () => this.request('/admin/stats');
}

// Window online listener to trigger sync automatically
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    ApiClient.syncOfflineQueue();
  });
}
