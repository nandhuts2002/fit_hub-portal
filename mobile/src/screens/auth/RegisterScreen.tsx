import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import { registerSchema } from '../../utils/validators';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { http, getApiErrorMessage } from '../../api/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const fieldErrors = useMemo(() => {
    const parsed = registerSchema.safeParse({ firstName, lastName, email, password, confirmPassword });
    if (parsed.success) return {};
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
    return map;
  }, [firstName, lastName, email, password, confirmPassword]);

  const onSubmit = async () => {
    setError(null);
    setDebugOtp(null);
    const parsed = registerSchema.safeParse({ firstName, lastName, email, password, confirmPassword });
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      const payload = {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        password: parsed.data.password,
        role: 'user',
      };
      const res = await http.post('/signup-init', payload);
      if (res.data?.debugOtp) setDebugOtp(String(res.data.debugOtp));
      navigation.replace('VerifyOtp', { email: parsed.data.email });
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
          <FitHubLogo subtitle="Create your FitHub account" />

          <View style={styles.card}>
            <Text variant="headlineSmall" style={styles.title}>
              Sign up
            </Text>

            <FormTextField label="First name" value={firstName} onChangeText={setFirstName} errorText={fieldErrors.firstName} />
            <FormTextField label="Last name" value={lastName} onChangeText={setLastName} errorText={fieldErrors.lastName} />
            <FormTextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" errorText={fieldErrors.email} />
            <FormTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry errorText={fieldErrors.password} />
            <FormTextField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              errorText={fieldErrors.confirmPassword}
            />

            {!!debugOtp && (
              <View style={styles.debugOtpBox}>
                <Text style={styles.debugOtpText}>Dev OTP: {debugOtp}</Text>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.cta}>
              Send OTP
            </Button>

            <Button onPress={() => navigation.goBack()} textColor="rgba(245,247,255,0.8)">
              Back to sign in
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
    gap: 2,
  },
  title: { marginBottom: 8, fontWeight: '800' },
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
  debugOtpBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,87,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.18)',
  },
  debugOtpText: { color: 'rgba(255,230,185,0.95)' },
});

