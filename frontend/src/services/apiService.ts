/**
 * Centralized API Service for Experimind Labs IMS
 * 
 * Provides authenticated HTTP methods with automatic JWT token injection,
 * 401 auto-logout, and consistent error handling.
 */
// Build base URL from environment
const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
let BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');
if (!BASE_URL.endsWith('/api')) {
  BASE_URL = `${BASE_URL}/api`;
}

export { BASE_URL };

/** Shape of a standard API error response */
interface ApiErrorResponse {
  message: string;
  stack?: string;
}

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let inMemoryToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  inMemoryToken = token;
  try {
    if (token) {
      localStorage.setItem('raw_auth_token', token);
    } else {
      localStorage.removeItem('raw_auth_token');
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get the current auth token from in-memory cache, direct storage, or persisted state
 */
export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;

  try {
    const rawToken = localStorage.getItem('raw_auth_token');
    if (rawToken) {
      inMemoryToken = rawToken;
      return rawToken;
    }

    const persisted = localStorage.getItem('persist:root');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      if (parsed.auth) {
        const authState = JSON.parse(parsed.auth);
        if (authState.token) {
          inMemoryToken = authState.token;
          return authState.token;
        }
      }
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Build headers with optional auth token
 */
function buildHeaders(authenticated: boolean = true, customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (authenticated) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Process a fetch response: handle 401 auto-logout, parse JSON, throw on errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized
  if (response.status === 401) {
    const isAuthCheck = response.url.includes('/auth/me') || response.url.includes('/auth/login');
    if (isAuthCheck && window.location.pathname !== '/login') {
      try {
        localStorage.removeItem('persist:root');
        localStorage.removeItem('raw_auth_token');
      } catch {
        // Ignore storage errors
      }
      window.location.href = '/login';
    }
    throw new ApiError('Session expired or unauthorized. Please login again.', 401);
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new ApiError('Access denied. You do not have permission to perform this action.', 403);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Try to parse JSON
  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status);
    }
    return {} as T;
  }

  if (!response.ok) {
    let errorMessage = (data as ApiErrorResponse)?.message || `Request failed with status ${response.status}`;
    if (
      errorMessage.includes('EMAXCONNSESSION') ||
      errorMessage.includes('max clients reached') ||
      errorMessage.includes('prisma.') ||
      errorMessage.includes('invocation:')
    ) {
      errorMessage = 'Server database is currently busy. Please try again in a few seconds.';
    }
    throw new ApiError(errorMessage, response.status);
  }

  return data as T;
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

/**
 * API Service — all methods automatically attach JWT token
 */
const apiService = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, authenticated: boolean = true): Promise<T> {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(authenticated),
    });
    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, authenticated: boolean = true): Promise<T> {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(authenticated),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, authenticated: boolean = true): Promise<T> {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(authenticated),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, authenticated: boolean = true): Promise<T> {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(authenticated),
    });
    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, authenticated: boolean = true): Promise<T> {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(authenticated),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
};

export default apiService;
