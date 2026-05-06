const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const getToken = () => localStorage.getItem('UNIVERSE_AUTH_TOKEN');
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonOptions = (body) => ({
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: JSON.stringify(body),
});

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || response.statusText || 'Request failed');
  }
  return response.json();
}

export const signup = (payload) => request('/api/signup', { method: 'POST', ...jsonOptions(payload) });
export const login = (email, password) => request('/api/login', { method: 'POST', ...jsonOptions({ email, password }) });
export const getProfile = () => request('/api/profile');
export const updateProfile = (preferences) => request('/api/profile', { method: 'POST', ...jsonOptions({ preferences }) });
export const fetchColleges = () => request('/api/colleges');
export const createCollege = (data) => request('/api/colleges', { method: 'POST', ...jsonOptions(data) });
export const deleteCollege = (id) => request(`/api/colleges/${id}`, { method: 'DELETE' });
export const fetchStudents = () => request('/api/students');
export const createStudent = (data) => request('/api/students', { method: 'POST', ...jsonOptions(data) });
export const deleteStudent = (id) => request(`/api/students/${id}`, { method: 'DELETE' });
export const fetchMessages = () => request('/api/messages');
export const createMessage = (text) => request('/api/messages', { method: 'POST', ...jsonOptions({ text }) });
export const deleteMessage = (id) => request(`/api/messages/${id}`, { method: 'DELETE' });
export const fetchApplications = () => request('/api/applications');
export const applyCollege = (data) => request('/api/apply', { method: 'POST', ...jsonOptions(data) });
export const deleteApplication = (id) => request(`/api/applications/${id}`, { method: 'DELETE' });
