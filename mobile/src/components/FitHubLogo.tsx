import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

export function FitHubLogo({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <MaterialCommunityIcons name="yoga" size={26} color={colors.primary2} />
        <Text style={styles.brand}>
          FIT<Text style={styles.brandAccent}>HUB</Text>
        </Text>
      </View>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 1.1 },
  brandAccent: { color: colors.primary },
  subtitle: { color: 'rgba(245,247,255,0.7)', fontSize: 13 },
});

