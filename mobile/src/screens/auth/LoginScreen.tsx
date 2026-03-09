import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import { getApiErrorMessage } from '../../api/http';
import { useAuth } from '../../auth/AuthProvider';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { loginSchema } from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldErrors = useMemo(() => {
    const parsed = loginSchema.safeParse({ email, password });
    if (parsed.success) return {};
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
    return map;
  }, [email, password]);

  const onSubmit = async () => {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return;
    setSubmitting(true);
    try {
      await signInWithPassword(parsed.data.email, parsed.data.password);
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
          <FitHubLogo subtitle="Sign in to continue your journey" />

          <View style={styles.card}>
            <Text variant="headlineSmall" style={styles.title}>
              Welcome back
            </Text>

            <FormTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              errorText={fieldErrors.email}
            />

            <FormTextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              errorText={fieldErrors.password}
              right={
                <TextInput.Icon
                  icon={showPw ? 'eye-off' : 'eye'}
                  onPress={() => setShowPw((v) => !v)}
                />
              }
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.cta}>
              Sign in
            </Button>

            <Button onPress={() => navigation.navigate('ForgotPassword')} textColor="rgba(245,247,255,0.8)">
              Forgot password?
            </Button>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New here?</Text>
              <Button compact onPress={() => navigation.navigate('Register')}>
                Create account
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 18,
  },
  card: {
    backgroundColor: 'rgba(17,28,47,0.78)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
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
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  footerText: { color: 'rgba(245,247,255,0.70)' },
});

