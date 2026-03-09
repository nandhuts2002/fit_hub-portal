import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { resetPasswordSchema } from '../../utils/validators';
import { http, getApiErrorMessage } from '../../api/http';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fieldErrors = useMemo(() => {
    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (parsed.success) return {};
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) map[String(issue.path[0])] = issue.message;
    return map;
  }, [token, password, confirmPassword]);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) return;
    setSubmitting(true);
    try {
      const res = await http.post('/reset-password', { token: parsed.data.token, password: parsed.data.password });
      setInfo(res.data?.msg || 'Password updated. You can sign in now.');
      setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), 700);
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
          <FitHubLogo subtitle="Set a new password" />

          <View style={styles.card}>
            <Text variant="headlineSmall" style={styles.title}>
              Reset password
            </Text>

            <FormTextField label="Reset token" value={token} onChangeText={setToken} errorText={fieldErrors.token} />
            <FormTextField label="New password" value={password} onChangeText={setPassword} secureTextEntry errorText={fieldErrors.password} />
            <FormTextField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              errorText={fieldErrors.confirmPassword}
            />

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
              Update password
            </Button>
            <Button onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} textColor="rgba(245,247,255,0.8)">
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
    gap: 6,
  },
  title: { marginBottom: 4, fontWeight: '800' },
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

