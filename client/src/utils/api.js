// client/src/utils/api.js
const rawBase =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE)) || '';

const API_BASE = rawBase
  ? (rawBase.endsWith('/api')
      ? rawBase
      : `${rawBase.replace(/\/+$/, '')}/api`)
  : '/api';

export function getAuthToken(role) {
  if (role) {
    return localStorage.getItem(`mentora_${role}_token`) || localStorage.getItem('mentora_token');
  }
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/admin')) {
      return localStorage.getItem('mentora_admin_token') || localStorage.getItem('mentora_token');
    }
    if (window.location.pathname.startsWith('/student')) {
      return localStorage.getItem('mentora_student_token') || localStorage.getItem('mentora_token');
    }
  }
  return localStorage.getItem('mentora_mentor_token') || localStorage.getItem('mentora_token');
}

export function setAuthToken(token, role = 'mentor') {
  if (token) {
    localStorage.setItem(`mentora_${role}_token`, token);
    localStorage.setItem('mentora_token', token);
    localStorage.setItem('mentora_role', role);
  } else {
    localStorage.removeItem(`mentora_${role}_token`);
    if (localStorage.getItem('mentora_role') === role) {
      localStorage.removeItem('mentora_token');
      localStorage.removeItem('mentora_role');
    }
  }
}

export async function apiRequest(endpoint, options = {}) {
  // Determine token to use
  let role = options.role || null;
  if (!role) {
    if (endpoint.startsWith('/admin')) role = 'admin';
    else if (endpoint.startsWith('/student')) role = 'student';
    else if (endpoint.startsWith('/mentor') || endpoint.startsWith('/mentees') || endpoint.startsWith('/coordinator') || endpoint.startsWith('/class')) role = 'mentor';
  }

  const token = options.token || getAuthToken(role);
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (!endpoint.includes('/auth/') && !endpoint.startsWith('/public')) {
        // Clear token on auth expiry (401 Unauthorized only)
        if (role) setAuthToken(null, role);
        window.dispatchEvent(new CustomEvent('auth-expired', { detail: { role } }));
      }
    }
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/public/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'File upload failed');
  }

  return data; // { url, filename, originalname, size }
}

