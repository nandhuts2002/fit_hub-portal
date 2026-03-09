import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { GradientBackground } from '../../components/GradientBackground';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YOGA_POSES } from '../../utils/postureCorrection';
import { colors } from '../../theme';

const EXERCISES = [
    { id: 'squat', name: 'Squats', emoji: '🏋️', description: 'Classic lower body strength exercise.' },
    { id: 'pushup', name: 'Pushups', emoji: '💪', description: 'Upper body and core strength.' },
    { id: 'curl', name: 'Bicep Curls', emoji: '🦾', description: 'Isolated arm strength building.' },
];

export function PostureSelectionScreen() {
    const navigation = useNavigation<any>();
    const [category, setCategory] = useState<'exercise' | 'yoga'>('exercise');

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
                    </TouchableOpacity>
                    <Text variant="headlineMedium" style={styles.title}>Correction</Text>
                </View>

                <View style={styles.tabContainer}>
                    <Chip
                        selected={category === 'exercise'}
                        onPress={() => setCategory('exercise')}
                        style={[styles.chip, category === 'exercise' && styles.selectedChip]}
                        textStyle={styles.chipText}
                    >
                        Exercises
                    </Chip>
                    <Chip
                        selected={category === 'yoga'}
                        onPress={() => setCategory('yoga')}
                        style={[styles.chip, category === 'yoga' && styles.selectedChip]}
                        textStyle={styles.chipText}
                    >
                        Yoga
                    </Chip>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {category === 'exercise' ? (
                        EXERCISES.map((ex) => (
                            <Card key={ex.id} style={styles.card} onPress={() => navigation.navigate('PostureCorrection', { type: ex.id, name: ex.name, mode: 'exercise' })}>
                                <Card.Title
                                    title={ex.name}
                                    subtitle={ex.description}
                                    left={(props) => <Text {...props} style={styles.emoji}>{ex.emoji}</Text>}
                                />
                            </Card>
                        ))
                    ) : (
                        YOGA_POSES.map((pose) => (
                            <Card key={pose.id} style={styles.card} onPress={() => navigation.navigate('PostureCorrection', { type: pose.id, name: pose.name, mode: 'yoga' })}>
                                <Card.Title
                                    title={pose.name}
                                    subtitle={pose.description}
                                    left={(props) => <Text {...props} style={styles.emoji}>{pose.emoji}</Text>}
                                />
                            </Card>
                        ))
                    )}
                </ScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 18, paddingTop: 54 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    title: { fontWeight: '900', color: 'white' },
    tabContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    chip: { backgroundColor: 'rgba(255,255,255,0.1)', flex: 1 },
    selectedChip: { backgroundColor: colors.primary2 },
    chipText: { color: 'white' },
    scrollContent: { gap: 12, paddingBottom: 40 },
    card: {
        backgroundColor: 'rgba(17,28,47,0.70)',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderRadius: 18,
    },
    emoji: { fontSize: 24, paddingLeft: 10 },
});
