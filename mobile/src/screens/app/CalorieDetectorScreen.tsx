import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Text, Surface, Button, Chip, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../../components/GradientBackground';

const ACTIVITY_LEVELS = [
    { label: 'Sedentary', value: 1.2, desc: 'Little to no exercise', icon: 'seat-recline-normal' },
    { label: 'Lightly Active', value: 1.375, desc: '1-3 days/week', icon: 'walk' },
    { label: 'Moderately Active', value: 1.55, desc: '3-5 days/week', icon: 'run' },
    { label: 'Very Active', value: 1.725, desc: '6-7 days/week', icon: 'bike' },
    { label: 'Extra Active', value: 1.9, desc: 'Hard physical job', icon: 'flash' },
];

export function CalorieDetectorScreen() {
    const navigation = useNavigation();
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'m' | 'f'>('m');
    const [activityLevel, setActivityLevel] = useState(1.55);
    const [result, setResult] = useState<{ bmr: number; daily: number } | null>(null);

    const calculateCalories = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age);
        if (!w || !h || !a) return;

        let bmr = 0;
        if (gender === 'm') {
            bmr = 10 * w + 6.25 * h - 5 * a + 5;
        } else {
            bmr = 10 * w + 6.25 * h - 5 * a - 161;
        }

        const daily = bmr * activityLevel;
        setResult({ bmr, daily });
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
                        </TouchableOpacity>
                        <Text variant="headlineSmall" style={styles.title}>Metabolism</Text>
                    </View>

                    <Surface style={styles.glassCard} elevation={0}>
                        <Text style={styles.sectionHeader}>BODY DATA</Text>

                        <View style={styles.row}>
                            <View style={styles.inputHost}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <View style={styles.inputGlass}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="decimal-pad"
                                        value={weight}
                                        onChangeText={setWeight}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputHost}>
                                <Text style={styles.label}>Height (cm)</Text>
                                <View style={styles.inputGlass}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="000"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="decimal-pad"
                                        value={height}
                                        onChangeText={setHeight}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputHost, { flex: 0.5 }]}>
                                <Text style={styles.label}>Age</Text>
                                <View style={styles.inputGlass}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="number-pad"
                                        value={age}
                                        onChangeText={setAge}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputHost}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderToggle}>
                                    <TouchableOpacity
                                        style={[styles.genderOption, gender === 'm' && styles.genderOptionActive]}
                                        onPress={() => setGender('m')}
                                    >
                                        <MaterialCommunityIcons name="human-male" size={20} color={gender === 'm' ? 'white' : 'rgba(255,255,255,0.3)'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.genderOption, gender === 'f' && styles.genderOptionActive, gender === 'f' && { backgroundColor: '#F472B6' }]}
                                        onPress={() => setGender('f')}
                                    >
                                        <MaterialCommunityIcons name="human-female" size={20} color={gender === 'f' ? 'white' : 'rgba(255,255,255,0.3)'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.sectionHeader}>ACTIVITY LEVEL</Text>
                        <View style={styles.activityGrid}>
                            {ACTIVITY_LEVELS.map((level) => (
                                <TouchableOpacity
                                    key={level.label}
                                    onPress={() => setActivityLevel(level.value)}
                                    style={[styles.activityCard, activityLevel === level.value && styles.activityCardActive]}
                                >
                                    <MaterialCommunityIcons
                                        name={level.icon as any}
                                        size={20}
                                        color={activityLevel === level.value ? 'white' : 'rgba(255,255,255,0.4)'}
                                    />
                                    <Text style={[styles.activityLabel, activityLevel === level.value && { color: 'white' }]}>{level.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            mode="contained"
                            onPress={calculateCalories}
                            style={styles.calcBtn}
                            contentStyle={{ height: 56 }}
                            labelStyle={styles.calcBtnLabel}
                        >
                            Calculate Needs
                        </Button>
                    </Surface>

                    {result && (
                        <Surface style={styles.resultGlass} elevation={0}>
                            <View style={styles.resRow}>
                                <View style={styles.resBlock}>
                                    <Text style={styles.resTitle}>BMR</Text>
                                    <Text style={styles.resValue}>{Math.round(result.bmr)}</Text>
                                    <Text style={styles.resUnit}>kcal / day</Text>
                                </View>
                                <View style={styles.resDivider} />
                                <View style={styles.resBlock}>
                                    <Text style={[styles.resTitle, { color: '#F59E0B' }]}>DAILY</Text>
                                    <Text style={[styles.resValue, { color: '#F59E0B' }]}>{Math.round(result.daily)}</Text>
                                    <Text style={styles.resUnit}>kcal / day</Text>
                                </View>
                            </View>

                            <View style={styles.tipBox}>
                                <MaterialCommunityIcons name="lightbulb-variant" size={20} color="#F59E0B" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tipTitle}>Energy Goals</Text>
                                    <Text style={styles.tipText}>
                                        To lose weight, target <Text style={{ fontWeight: '900', color: 'white' }}>{Math.round(result.daily - 500)}</Text> kcal.{"\n"}
                                        To gain weight, target <Text style={{ fontWeight: '900', color: 'white' }}>{Math.round(result.daily + 500)}</Text> kcal.
                                    </Text>
                                </View>
                            </View>
                        </Surface>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: 60, paddingHorizontal: 24 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 64,
        marginBottom: 24
    },
    backBtn: { marginRight: 16 },
    title: { fontWeight: '900', color: 'white', letterSpacing: -0.5 },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionHeader: { color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
    row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    inputHost: { flex: 1 },
    label: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 8, paddingLeft: 4 },
    inputGlass: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
    },
    input: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    genderToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 4,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    genderOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    genderOptionActive: { backgroundColor: '#F59E0B' },
    activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    activityCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activityCardActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: '#F59E0B',
    },
    activityLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    calcBtn: { marginTop: 8, borderRadius: 16, backgroundColor: 'white' },
    calcBtnLabel: { color: '#0A1121', fontWeight: '900', fontSize: 16 },
    resultGlass: {
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    resRow: { flexDirection: 'row', alignItems: 'center' },
    resBlock: { flex: 1, alignItems: 'center' },
    resTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    resValue: { fontSize: 32, fontWeight: '900', color: 'white', marginVertical: 4 },
    resUnit: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
    resDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
    tipBox: {
        marginTop: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    tipTitle: { color: '#F59E0B', fontWeight: '900', fontSize: 12, marginBottom: 4 },
    tipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 },
});
