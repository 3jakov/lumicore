import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.apiUrl ??
  'http://localhost:3001/api/v1';

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClient {
  private getToken: (() => string | null) | null = null;

  /** Call once from the auth store to inject token accessor. */
  setTokenProvider(fn: () => string | null) {
    this.getToken = fn;
  }

  private authHeader(): Record<string, string> {
    const token = this.getToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...this.authHeader() },
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader(), ...options?.headers },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeader(), ...options?.headers },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...this.authHeader(), ...options?.headers },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return undefined as T;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
