// src/services/api.js
// API 기본 설정 및 공통 함수

const _BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
// VITE_API_BASE_URL은 'http://localhost:8080' 형태로 설정 (뒤에 /api 붙이지 않아도 됨)
// Login.jsx 등 직접 fetch하는 파일들도 동일한 환경변수를 쓰므로 여기서 /api를 붙여줌
const API_BASE_URL = _BASE.endsWith('/api') ? _BASE : `${_BASE}/api`;

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * GET 요청
 */
export async function get(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  
  return apiRequest(url, {
    method: 'GET',
  });
}

/**
 * POST 요청
 */
export async function post(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT 요청
 */
export async function put(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 요청
 */
export async function del(endpoint) {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
}

export { API_BASE_URL };