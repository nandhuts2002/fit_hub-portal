import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Text, Surface, IconButton } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/GradientBackground';
import { FitHubLogo } from '../../components/FitHubLogo';
import { FormTextField } from '../../components/FormTextField';
import { registerSchema } from '../../utils/validators';
import type { AuthStackParamList } from '../../navigation/stacks/AuthStack';
import { http, getApiErrorMessage } from '../../api/http';
import { colors } from '../../theme';

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            />
          </View>

          <View style={styles.container}>
            <FitHubLogo subtitle="Join the FitHub community today" />

            <Surface style={styles.card} elevation={2}>
              <Text variant="headlineSmall" style={styles.title}>
                Create Account
              </Text>
              <Text style={styles.subtitle}>Fill in your details to get started</Text>

              <View style={styles.form}>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <FormTextField
                      label="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      errorText={fieldErrors.firstName}
                    />
                  </View>
                  <View style={styles.half}>
                    <FormTextField
                      label="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      errorText={fieldErrors.lastName}
                    />
                  </View>
                </View>

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
                  secureTextEntry
                  errorText={fieldErrors.password}
                />

                <FormTextField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  errorText={fieldErrors.confirmPassword}
                />

                {!!debugOtp && (
                  <View style={styles.debugOtpBox}>
                    <MaterialCommunityIcons name="xml" size={18} color="#FFC857" />
                    <Text style={styles.debugOtpText}>Dev OTP: {debugOtp}</Text>
                  </View>
                )}

                {!!error && (
                  <View style={styles.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={onSubmit}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.cta}
                  contentStyle={styles.ctaContent}
                  labelStyle={styles.ctaLabel}
                >
                  Send OTP
                </Button>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 8,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  title: {
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  form: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  cta: {
    marginTop: 12,
    borderRadius: 16,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaContent: {
    height: 56,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,77,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.2)',
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  debugOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,87,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.15)',
    gap: 8,
  },
  debugOtpText: {
    color: '#FFC857',
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary2,
    fontSize: 14,
    fontWeight: '800',
  }
});

