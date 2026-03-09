import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { http, getApiErrorMessage } from '../../api/http';
import { otpSchema } from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export function VerifyOtpScreen({ route, navigation }: Props) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = route.params.email;

  const fieldError = useMemo(() => {
    const parsed = otpSchema.safeParse({ email, otp });
    if (parsed.success) return null;
    return parsed.error.issues[0]?.message ?? 'Invalid OTP';
  }, [email, otp]);

  const verify = async () => {
    setError(null);
    const parsed = otpSchema.safeParse({ email, otp });
    if (!parsed.success) return;
    setSubmitting(true);
    try {
      await http.post('/signup-verify', { email: parsed.data.email, otp: parsed.data.otp });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    setResending(true);
    try {
      await http.post('/signup-resend', { email });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <FitHubLogo subtitle="Verify your email with the OTP" />

          <View style={styles.card}>
            <Text variant="headlineSmall" style={styles.title}>
              Enter OTP
            </Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

            <FormTextField
              label="6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              errorText={fieldError || undefined}
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button mode="contained" onPress={verify} loading={submitting} disabled={submitting} style={styles.cta}>
              Verify & continue
            </Button>
            <Button onPress={resend} loading={resending} disabled={resending} textColor="rgba(245,247,255,0.8)">
              Resend OTP
            </Button>
            <Button onPress={() => navigation.navigate('Register')} textColor="rgba(245,247,255,0.8)">
              Change email
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

