import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthStore } from '@/store/auth.store';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError('Неверный email или пароль');
      } else {
        setError('Нет соединения с сервером. Проверьте сеть.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-0"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo / title */}
        <View className="mb-12">
          <Text className="text-3xl font-bold text-text-primary">Lumicore</Text>
          <Text className="mt-1 text-sm text-text-secondary">Operational platform</Text>
        </View>

        {/* Fields */}
        <View className="gap-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-4 text-base text-text-primary"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Пароль"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-4 text-base text-text-primary"
          />
        </View>

        {/* Error */}
        {error && (
          <Text className="mt-3 text-sm text-timer-stop">{error}</Text>
        )}

        {/* Submit */}
        <Pressable
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password}
          className="mt-6 items-center justify-center rounded-2xl bg-accent-500 py-4 active:opacity-80 disabled:opacity-40"
        >
          {loading ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text className="text-base font-semibold text-black">Войти</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
