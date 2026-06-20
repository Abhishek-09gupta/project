const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (username, email, password) => 
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),

    getProfile: () => 
      request('/auth/profile'),

    getLeaderboard: () => 
      request('/auth/leaderboard'),
  },

  problems: {
    getAll: () => 
      request('/problems'),

    getById: (id) => 
      request(`/problems/${id}`),

    create: (problemData) => 
      request('/problems', {
        method: 'POST',
        body: JSON.stringify(problemData),
      }),

    update: (id, problemData) => 
      request(`/problems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(problemData),
      }),

    delete: (id) => 
      request(`/problems/${id}`, {
        method: 'DELETE',
      }),

    getAnalytics: () => 
      request('/problems/analytics'),
  },

  submissions: {
    submit: (problemId, language, code) => 
      request('/submissions', {
        method: 'POST',
        body: JSON.stringify({ problemId, language, code }),
      }),

    run: (problemId, language, code, customInput = null) => 
      request('/submissions/run', {
        method: 'POST',
        body: JSON.stringify({ problemId, language, code, customInput }),
      }),

    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.problemId) params.append('problemId', filters.problemId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.language) params.append('language', filters.language);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/submissions${query}`);
    },

    getById: (id) => 
      request(`/submissions/${id}`),

    getAIHint: (problemId, language, code) => 
      request('/submissions/ai-hint', {
        method: 'POST',
        body: JSON.stringify({ problemId, language, code }),
      }),

    getAIComplexity: (problemId, language, code) => 
      request('/submissions/ai-complexity', {
        method: 'POST',
        body: JSON.stringify({ problemId, language, code }),
      }),
  },

  contests: {
    getAll: () => 
      request('/contests'),

    getById: (id) => 
      request(`/contests/${id}`),

    create: (contestData) => 
      request('/contests', {
        method: 'POST',
        body: JSON.stringify(contestData),
      }),

    register: (id) => 
      request(`/contests/${id}/register`, {
        method: 'POST',
      }),

    getLeaderboard: (id) => 
      request(`/contests/${id}/leaderboard`),
  },

  discussions: {
    getByProblem: (problemId) => 
      request(`/discussions/${problemId}`),

    create: (problemId, comment) => 
      request('/discussions', {
        method: 'POST',
        body: JSON.stringify({ problemId, comment }),
      }),
  },
};
