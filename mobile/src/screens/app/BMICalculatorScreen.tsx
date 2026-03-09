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
import { Text, Surface, Button, IconButton, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../../components/GradientBackground';

export function BMICalculatorScreen() {
    const navigation = useNavigation();
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'m' | 'f'>('m');
    const [result, setResult] = useState<{ bmi: number; category: string; color: string; advice: string } | null>(null);

    const calculateBMI = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        if (!w || !h) return;

        const bmi = w / ((h / 100) * (h / 100));
        let category = '';
        let color = '';
        let advice = '';

        if (bmi < 18.5) {
            category = 'Underweight';
            color = '#38BDF8';
            advice = 'Focus on nutrient-dense foods and strength training.';
        } else if (bmi < 25) {
            category = 'Healthy';
            color = '#10B981';
            advice = 'Maintain your balanced diet and regular exercise.';
        } else if (bmi < 30) {
            category = 'Overweight';
            color = '#F59E0B';
            advice = 'Consider increasing cardio and refining your caloric intake.';
        } else {
            category = 'Obese';
            color = '#EF4444';
            advice = 'Consult a specialist to develop a safe weight loss plan.';
        }

        setResult({ bmi, category, color, advice });
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
                        <Text variant="headlineSmall" style={styles.title}>Health Stats</Text>
                    </View>

                    <Surface style={styles.glassCard} elevation={0}>
                        <Text style={styles.sectionHeader}>BIOMETRICS</Text>

                        <View style={styles.row}>
                            <View style={styles.inputHost}>
                                <Text style={styles.label}>Weight</Text>
                                <View style={styles.inputGlass}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="decimal-pad"
                                        value={weight}
                                        onChangeText={setWeight}
                                    />
                                    <Text style={styles.unit}>kg</Text>
                                </View>
                            </View>

                            <View style={styles.inputHost}>
                                <Text style={styles.label}>Height</Text>
                                <View style={styles.inputGlass}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="000"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        keyboardType="decimal-pad"
                                        value={height}
                                        onChangeText={setHeight}
                                    />
                                    <Text style={styles.unit}>cm</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputHost}>
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
                                    <Text style={styles.unit}>yrs</Text>
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

                        <Button
                            mode="contained"
                            onPress={calculateBMI}
                            style={styles.calcBtn}
                            contentStyle={{ height: 56 }}
                            labelStyle={styles.calcBtnLabel}
                        >
                            Analyze BMI
                        </Button>
                    </Surface>

                    {result ? (
                        <Surface style={styles.resultGlass} elevation={0}>
                            <View style={[styles.arcHost, { borderColor: result.color + '20' }]}>
                                <View style={[styles.arcInner, { borderColor: result.color }]}>
                                    <Text style={[styles.bmiValue, { color: result.color }]}>{result.bmi.toFixed(1)}</Text>
                                    <Text style={styles.bmiUnit}>INDEX</Text>
                                </View>
                            </View>

                            <View style={styles.resultMeta}>
                                <Text variant="headlineSmall" style={[styles.categoryText, { color: result.color }]}>{result.category.toUpperCase()}</Text>
                                <Text style={styles.adviceText}>{result.advice}</Text>
                            </View>

                            <View style={styles.bmiBar}>
                                <View style={[styles.barSegment, { backgroundColor: '#38BDF8', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]} />
                                <View style={[styles.barSegment, { backgroundColor: '#10B981' }]} />
                                <View style={[styles.barSegment, { backgroundColor: '#F59E0B' }]} />
                                <View style={[styles.barSegment, { backgroundColor: '#EF4444', borderTopRightRadius: 10, borderBottomRightRadius: 10 }]} />
                                <View style={[styles.barPointer, { left: (Math.min(Math.max((result.bmi - 15) * 4, 2), 94) + '%') as any }]} />
                            </View>
                        </Surface>
                    ) : (
                        <View style={styles.placeholder}>
                            <MaterialCommunityIcons name="heart-pulse" size={48} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.placeholderText}>Enter stats to see analysis</Text>
                        </View>
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
    sectionHeader: { color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 12, letterSpacing: 1.5, marginBottom: 20 },
    row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    inputHost: { flex: 1 },
    label: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 8, paddingLeft: 4 },
    inputGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    unit: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.3)' },
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
    genderOptionActive: { backgroundColor: '#4FACFE' },
    calcBtn: { marginTop: 8, borderRadius: 16, backgroundColor: 'white' },
    calcBtnLabel: { color: '#0A1121', fontWeight: '900', fontSize: 16 },
    resultGlass: {
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    arcHost: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arcInner: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bmiValue: { fontSize: 36, fontWeight: '900' },
    bmiUnit: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginTop: -2 },
    resultMeta: { alignItems: 'center', marginTop: 24 },
    categoryText: { fontWeight: '900', letterSpacing: 1 },
    adviceText: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22, marginTop: 8 },
    bmiBar: { width: '100%', height: 8, flexDirection: 'row', marginTop: 32, position: 'relative' },
    barSegment: { flex: 1 },
    barPointer: {
        position: 'absolute',
        top: -6,
        width: 4,
        height: 20,
        backgroundColor: 'white',
        borderRadius: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    placeholder: { alignItems: 'center', marginTop: 100, opacity: 0.3 },
    placeholderText: { color: 'white', fontWeight: '800', marginTop: 12 },
});
