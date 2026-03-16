import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { colors } from '../theme';

export function FormTextField({
  label,
  value,
  onChangeText,
  autoCapitalize = 'none',
  keyboardType,
  secureTextEntry,
  errorText,
  right,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  errorText?: string;
  right?: React.ComponentProps<typeof TextInput>['right'];
}) {
  const hasError = !!errorText;
  return (
    <View style={styles.wrap}>
      <TextInput
        mode="flat"
        label={label}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        error={hasError}
        right={right}
        style={styles.input}
        underlineColor="rgba(255,255,255,0.1)"
        activeUnderlineColor={colors.primary2}
        textColor="white"
        contentStyle={styles.contentStyle}
      />
      <HelperText type="error" visible={hasError} style={styles.helper}>
        {errorText || ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 56,
  },
  contentStyle: {
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  helper: {
    marginTop: -2,
    marginBottom: 2,
    fontWeight: '500',
  },
});

