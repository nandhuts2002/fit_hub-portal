import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

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
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        error={hasError}
        right={right}
      />
      <HelperText type="error" visible={hasError}>
        {errorText || ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});

