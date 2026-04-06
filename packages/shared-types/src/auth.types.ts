// Auth contracts — used by both NestJS API and Next.js frontend

import { Language, TimeFormat } from './enums';

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface OtpRequestDto {
  phone: string;
}

export interface OtpVerifyDto {
  phone: string;
  code: string;
}

export interface RefreshTokenDto {
  /** Omit for web clients (uses httpOnly cookie). Present for native clients. */
  refresh_token?: string;
}

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: CurrentUser;
}

/** Minimal user payload embedded in JWT and returned with every auth response */
export interface CurrentUser {
  id: number;
  full_name: string;
  initials: string;
  photo_url: string | null;
  avatar_color: string;
  language: Language;
  time_format: TimeFormat;
  roles: string[];        // role names e.g. ['Administraator']
  group: string;          // EmployeeGroup value
}
