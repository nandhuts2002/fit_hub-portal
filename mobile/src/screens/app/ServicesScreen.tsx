import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, TouchableRipple } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../../components/GradientBackground';
import { colors } from '../../theme';
import { useAuth } from '../../auth/AuthProvider';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const SERVICES = [
  {
    id: 'bmi',
    title: 'BMI Calculator',
    subtitle: 'Track your health index',
    icon: 'scale-bathroom',
    colors: ['#FF0099', '#493240', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#FF0099',
  },
  {
    id: 'calorie',
    title: 'Daily Calories',
    subtitle: 'BMR & energy needs',
    icon: 'fire',
    colors: ['#FF8A00', '#493240', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#FF8A00',
  },
  {
    id: 'exercise_explorer',
    title: 'Exercise Library',
    subtitle: '1000+ Pro GIFs',
    icon: 'dumbbell',
    colors: ['#00F2FE', '#4FACFE', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#4FACFE',
  },
  {
    id: 'posture',
    title: 'AI Correction',
    subtitle: 'Form-check expert',
    icon: 'human-distancing',
    colors: ['#7C3AED', '#4C1D95', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#A78BFA',
  },
  {
    id: 'yoga',
    title: 'Yoga Studio',
    subtitle: 'Master every pose',
    icon: 'yoga',
    colors: ['#10B981', '#064E3B', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#34D399',
  },
  {
    id: 'progress',
    title: 'Analytics',
    subtitle: 'Visualize gains',
    icon: 'chart-arc',
    colors: ['#94A3B8', '#1E293B', '#0A0F1A'] as [string, string, ...string[]],
    accent: '#CBD5E1',
  },
];

export function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { state } = useAuth();
  const name = state.status === 'authed' ? state.user.name : 'Athlete';

  const handlePress = (id: string) => {
    switch (id) {
      case 'bmi': navigation.navigate('BMICalculator'); break;
      case 'calorie': navigation.navigate('CalorieDetector'); break;
      case 'exercise_explorer': navigation.navigate('ExerciseExplorer'); break;
      case 'posture': navigation.navigate('PostureSelection'); break;
      case 'yoga': navigation.navigate('YogaExplorer'); break;
      case 'progress': navigation.navigate('Progress'); break;
    }
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="displaySmall" style={styles.heroTitle}>FitHub Hub</Text>
          <Text style={styles.heroSub}>Ready for your next session, {name}?</Text>

          <Surface style={styles.statsGlass} elevation={0}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>GOAL</Text>
              <Text style={styles.statVal}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statVal}>5 Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>LEVEL</Text>
              <Text style={styles.statVal}>Pro</Text>
            </View>
          </Surface>
        </View>

        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <TouchableRipple
              key={s.id}
              onPress={() => handlePress(s.id)}
              rippleColor="rgba(255,255,255,0.1)"
              style={styles.cardRipple}
            >
              <Surface style={styles.card} elevation={4}>
                <LinearGradient colors={s.colors} style={styles.cardContent}>
                  <View style={[styles.iconBox, { backgroundColor: s.accent + '20' }]}>
                    <MaterialCommunityIcons name={s.icon as any} size={32} color={s.accent} />
                  </View>
                  <View>
                    <Text variant="titleSmall" style={styles.cardTitle}>{s.title}</Text>
                    <Text style={styles.cardSub}>{s.subtitle}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={[styles.dot, { backgroundColor: s.accent }]} />
                    <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                </LinearGradient>
              </Surface>
            </TouchableRipple>
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 60 },
  hero: { padding: 24, paddingTop: 64, marginBottom: 12 },
  heroTitle: { fontWeight: '900', color: 'white', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '600' },
  statsGlass: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: 1 },
  statVal: { color: 'white', fontWeight: '800', fontSize: 16, marginTop: 4 },
  statDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardRipple: {
    width: CARD_WIDTH,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 4,
  },
  card: {
    width: '100%',
    height: CARD_WIDTH * 1.15,
    borderRadius: 28,
    backgroundColor: '#0E1626',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '900', color: 'white', fontSize: 15 },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
