import type { ApiError } from '@lumicore/shared-types';

import { env } from '@/lib/config/env';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: 'no-store',
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      throw new Error('Unauthorized');
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

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(this.buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: null }),
    });

    if (!response.ok) {
      this.accessToken = null;
      return;
    }

    const data = (await response.json()) as { access_token?: string };
    this.accessToken = data.access_token ?? null;
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
