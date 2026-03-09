import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { forgotPasswordSchema } from '../../utils/validators';
import { http, getApiErrorMessage } from '../../api/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fieldError = useMemo(() => {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (parsed.success) return null;
    return parsed.error.issues[0]?.message ?? 'Invalid email';
  }, [email]);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      const res = await http.post('/forgot-password', {
        email: parsed.data.email,
        appBaseUrl: 'fithub://app',
      });
      const token = res.data?.token as string | undefined;
      if (token) {
        navigation.navigate('ResetPassword', { token });
        return;
      }
      setInfo(res.data?.msg || 'If that email exists, a reset link has been sent.');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <FitHubLogo subtitle="Reset your password" />

          <View style={styles.card}>
            <Text variant="headlineSmall" style={styles.title}>
              Forgot password
            </Text>
            <Text style={styles.subtitle}>Enter your email and we’ll send a reset link.</Text>

            <FormTextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" errorText={fieldError || undefined} />

            {!!info && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{info}</Text>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.cta}>
              Send reset link
            </Button>
            <Button onPress={() => navigation.goBack()} textColor="rgba(245,247,255,0.8)">
              Back
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 44, paddingBottom: 24, gap: 18 },
  card: {
    backgroundColor: 'rgba(17,28,47,0.78)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  title: { marginBottom: 4, fontWeight: '800' },
  subtitle: { color: 'rgba(245,247,255,0.70)', marginBottom: 8 },
  cta: { marginTop: 6, borderRadius: 14 },
  infoBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,87,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.18)',
  },
  infoText: { color: 'rgba(255,230,185,0.95)' },
  errorBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.25)',
  },
  errorText: { color: 'rgba(255,200,200,0.95)' },
});

