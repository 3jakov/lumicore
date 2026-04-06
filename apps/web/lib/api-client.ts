import type { ApiError, AuthResponse } from '@lumicore/shared-types';

import { env } from '@/lib/config/env';
import { useAuthStore } from '@/store/auth.store';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

class ApiClient {
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async put<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
    retry = false,
  ): Promise<T> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(this.buildUrl(path), {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: 'no-store',
    });

    if (response.status === 401 && !retry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(method, path, options, true);
      }
      // refresh failed — clearSession already called; surface the original error
      throw await this.toApiError(response);
    }

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${env.apiUrl}/api/v1${normalizedPath}`;
  }

  /**
   * Attempts a silent token refresh using the httpOnly refresh_token cookie.
   * Returns true if a new access token was obtained, false otherwise.
   * Calls clearSession() on failure so the store is never left in a stale state.
   */
  private async refreshAccessToken(): Promise<boolean> {
    const response = await fetch(this.buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      // No body — web client relies on the httpOnly refresh_token cookie
    });

    if (!response.ok) {
      useAuthStore.getState().clearSession();
      return false;
    }

    const data = (await response.json()) as AuthResponse;
    useAuthStore.getState().setSession({
      accessToken: data.access_token,
      currentUser: data.user,
    });
    return true;
  }

  private async toApiError(response: Response): Promise<ApiError> {
    const data = (await response.json().catch(() => null)) as ApiError | null;

    return (
      data ?? {
        statusCode: response.status,
        error: response.statusText,
        message: 'Unexpected API error',
      }
    );
  }
}

export const apiClient = new ApiClient();
