'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { AuthResponse, LoginDto, OtpRequestDto, OtpVerifyDto } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'An error occurred. Please try again.';
}

// ─── Password login ───────────────────────────────────────────────────────────

export function useLoginWithPassword() {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  async function login(dto: LoginDto): Promise<void> {
    setState({ isLoading: true, error: null });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', { body: dto });
      setSession({ accessToken: data.access_token, currentUser: data.user });
      router.replace('/dashboard');
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return { ...state, login };
}

// ─── OTP login (two-step) ─────────────────────────────────────────────────────

export function useOtpLogin() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  async function requestOtp(dto: OtpRequestDto): Promise<void> {
    setState({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/otp/request', { body: dto });
      setPhone(dto.phone);
      setStep('code');
      setState({ isLoading: false, error: null });
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  async function verifyOtp(dto: OtpVerifyDto): Promise<void> {
    setState({ isLoading: true, error: null });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/otp/verify', { body: dto });
      setSession({ accessToken: data.access_token, currentUser: data.user });
      router.replace('/dashboard');
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    step,
    phone,
    requestOtp,
    verifyOtp,
    backToPhone: () => {
      setStep('phone');
      setState({ isLoading: false, error: null });
    },
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout(): Promise<void> {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Always clean up locally even if the backend call fails
      // (e.g. token already expired, network error)
    } finally {
      queryClient.clear();
      clearSession();
      router.replace('/login');
    }
  }

  return { isLoading, logout };
}
