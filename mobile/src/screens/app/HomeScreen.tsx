import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, Avatar, IconButton, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/GradientBackground';
import { useAuth } from '../../auth/AuthProvider';
import { colors } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '../../navigation/tabs/AppTabs';

export function HomeScreen() {
  const { state } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();
  const name = state.status === 'authed' ? state.user.name : 'Athlete';
  const role = state.status === 'authed' ? state.user.role : 'user';

  const QUICK_ACTIONS = [
    { label: 'Workouts', icon: 'dumbbell', color: '#6366F1', route: 'Sessions' },
    { label: 'Yoga Poses', icon: 'yoga', color: '#10B981', route: 'Sessions' },
    { label: 'Health Tools', icon: 'calculator', color: '#F59E0B', route: 'Sessions' },
    { label: 'Marketplace', icon: 'store', color: '#EC4899', route: 'Shop' },
  ];

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Good Morning,</Text>
            <Text variant="headlineMedium" style={styles.name}>{name}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar.Text
              size={48}
              label={name[0].toUpperCase()}
              style={styles.avatar}
              labelStyle={{ fontWeight: '900' }}
            />
          </TouchableOpacity>
        </View>

        {/* Status Glass Card */}
        <Surface style={styles.statusGlass} elevation={0}>
          <View style={styles.statusTop}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>DAILY ACTIVITY</Text>
              <Text style={styles.statusVal}>2,450 <Text style={styles.statusUnit}>KCAL</Text></Text>
            </View>
            <View style={styles.statusIconBox}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F59E0B" />
            </View>
          </View>
          <View style={styles.statusProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>75% of your daily goal</Text>
          </View>
        </Surface>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <Surface key={i} style={styles.actionCard} elevation={0}>
              <TouchableRipple
                onPress={() => navigation.navigate(action.route as any)}
                style={styles.actionRipple}
                rippleColor="rgba(255,255,255,0.1)"
              >
                <>
                  <View style={[styles.actionIconBox, { backgroundColor: action.color + '20' }]}>
                    <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </>
              </TouchableRipple>
            </Surface>
          ))}
        </View>

        {/* Hero Banner Section */}
        <Surface style={styles.heroGlass} elevation={0}>
          <View style={styles.heroContent}>
            <Text variant="headlineSmall" style={styles.heroTitle}>FitHub Pro</Text>
            <Text style={styles.heroSub}>
              Premium fitness tracking with real-time AI pose correction. Connected and optimized.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('Sessions')}
            >
              <Text style={styles.heroBtnText}>Explorer Now</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#0A1121" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroDecor}>
            <MaterialCommunityIcons name="heart-pulse" size={120} color="rgba(255,255,255,0.05)" />
          </View>
        </Surface>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.roleTag}>{role.toUpperCase()} ACCOUNT</Text>
          <Text style={styles.version}>v 1.2.0 • Secured by Expo</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32
  },
  welcome: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  name: { fontWeight: '900', color: 'white', letterSpacing: -0.5, marginTop: -4 },
  avatar: { backgroundColor: '#4FACFE' },
  statusGlass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32
  },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusInfo: { gap: 4 },
  statusLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  statusVal: { fontSize: 32, fontWeight: '900', color: 'white' },
  statusUnit: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  statusIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' },
  statusProgress: { gap: 12 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionRipple: { padding: 20, gap: 12 },
  actionIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontWeight: '900', color: 'white', fontSize: 14 },
  heroGlass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 40
  },
  heroContent: { flex: 1, gap: 12, zIndex: 1 },
  heroTitle: { fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 8
  },
  heroBtnText: { color: '#0A1121', fontWeight: '900', fontSize: 13 },
  heroDecor: { position: 'absolute', right: -20, bottom: -20, opacity: 0.5 },
  footer: { alignItems: 'center', gap: 8 },
  roleTag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  version: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },
});

