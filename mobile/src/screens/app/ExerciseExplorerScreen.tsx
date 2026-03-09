import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    View,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    ScrollView,
} from 'react-native';
import { Text, Surface, Chip, IconButton, Portal, Modal, Button, TouchableRipple } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../../components/GradientBackground';
import { http } from '../../api/http';
import { API_BASE_URL } from '../../config';

const BODY_PARTS = [
    'all', 'chest', 'back', 'upper legs', 'lower legs',
    'upper arms', 'lower arms', 'waist', 'neck', 'shoulders'
];

interface Exercise {
    _id: string;
    name: string;
    bodyPart: string;
    target: string;
    equipment: string;
    mediaUrl?: string;
    gifUrl?: string;
    instructions: string | string[];
}

export function ExerciseExplorerScreen() {
    const navigation = useNavigation<any>();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBodyPart, setSelectedBodyPart] = useState('all');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            let url = '/api/custom-exercises';
            if (search.trim()) {
                url = `/api/custom-exercises/search?q=${encodeURIComponent(search.trim())}`;
            } else if (selectedBodyPart !== 'all') {
                url = `/api/custom-exercises?body_part=${encodeURIComponent(selectedBodyPart)}`;
            }

            const res = await http.get(url);
            setExercises(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
            console.error('Error fetching exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchExercises();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, selectedBodyPart]);

    const renderExercise = ({ item }: { item: Exercise }) => {
        const imgUrl = item.mediaUrl || item.gifUrl;
        const fullImgUrl = imgUrl?.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`;

        return (
            <Surface style={styles.itemCard} elevation={0}>
                <TouchableRipple
                    onPress={() => setSelectedExercise(item)}
                    rippleColor="rgba(255,255,255,0.1)"
                    style={{ flex: 1 }}
                >
                    <View style={styles.itemContent}>
                        <Image source={{ uri: fullImgUrl }} style={styles.itemImage} />
                        <View style={styles.itemInfo}>
                            <Text variant="titleMedium" numberOfLines={1} style={styles.itemName}>
                                {item.name}
                            </Text>
                            <View style={styles.tagRow}>
                                <Surface style={styles.miniTag} elevation={0}>
                                    <Text style={styles.miniTagText}>{item.bodyPart}</Text>
                                </Surface>
                                <Surface style={[styles.miniTag, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]} elevation={0}>
                                    <Text style={[styles.miniTagText, { color: '#38BDF8' }]}>{item.target}</Text>
                                </Surface>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableRipple>
            </Surface>
        );
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
                    </TouchableOpacity>
                    <Text variant="headlineSmall" style={styles.title}>Library</Text>
                </View>

                <View style={styles.searchContainer}>
                    <Surface style={styles.searchGlass} elevation={0}>
                        <MaterialCommunityIcons name="magnify" size={22} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            placeholder="Search 1000+ exercises..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </Surface>
                </View>

                <View style={styles.chipHost}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {BODY_PARTS.map((bp) => (
                            <Chip
                                key={bp}
                                selected={selectedBodyPart === bp}
                                onPress={() => setSelectedBodyPart(bp)}
                                style={[
                                    styles.chip,
                                    selectedBodyPart === bp && { backgroundColor: '#4FACFE' }
                                ]}
                                textStyle={[
                                    styles.chipText,
                                    selectedBodyPart === bp && { color: 'white' }
                                ]}
                                showSelectedOverlay={false}
                            >
                                {bp.toUpperCase()}
                            </Chip>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator color="#4FACFE" style={{ marginTop: 60 }} />
                ) : (
                    <FlatList
                        data={exercises}
                        renderItem={renderExercise}
                        keyExtractor={(it) => it._id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyHost}>
                                <MaterialCommunityIcons name="dumbbell" size={48} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.empty}>No exercises found</Text>
                            </View>
                        }
                    />
                )}

                <Portal>
                    <Modal
                        visible={!!selectedExercise}
                        onDismiss={() => setSelectedExercise(null)}
                        contentContainerStyle={styles.modal}
                    >
                        {selectedExercise && (
                            <View>
                                <View style={styles.modalImgContainer}>
                                    <Image
                                        source={{ uri: (selectedExercise.mediaUrl || selectedExercise.gifUrl)?.startsWith('http') ? (selectedExercise.mediaUrl || selectedExercise.gifUrl) : `${API_BASE_URL}${selectedExercise.mediaUrl || selectedExercise.gifUrl}` }}
                                        style={styles.modalImage}
                                    />
                                    <IconButton
                                        icon="close"
                                        style={styles.modalClose}
                                        onPress={() => setSelectedExercise(null)}
                                        containerColor="rgba(0,0,0,0.5)"
                                        iconColor="white"
                                    />
                                </View>
                                <View style={styles.modalMeta}>
                                    <Text variant="headlineSmall" style={styles.modalTitle}>{selectedExercise.name}</Text>
                                    <Text style={styles.modalSub}>{selectedExercise.bodyPart} • {selectedExercise.target}</Text>

                                    <View style={styles.divider} />

                                    <Text variant="titleMedium" style={styles.instrHeader}>GUIDE</Text>
                                    <ScrollView style={styles.instrScroll} showsVerticalScrollIndicator={false}>
                                        {Array.isArray(selectedExercise.instructions) ? (
                                            selectedExercise.instructions.map((line, i) => (
                                                <View key={i} style={styles.instrRow}>
                                                    <Text style={styles.instrDot}>•</Text>
                                                    <Text style={styles.instrLine}>{line}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.instrLine}>{selectedExercise.instructions}</Text>
                                        )}
                                    </ScrollView>

                                    <Button
                                        mode="contained"
                                        style={styles.modalBtn}
                                        labelStyle={styles.modalBtnLabel}
                                        onPress={() => {
                                            setSelectedExercise(null);
                                            navigation.navigate('PostureCorrection', {
                                                type: selectedExercise.name,
                                                name: selectedExercise.name,
                                                mode: 'exercise'
                                            });
                                        }}
                                    >
                                        Start Smart Correction
                                    </Button>
                                </View>
                            </View>
                        )}
                    </Modal>
                </Portal>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: 24,
        marginBottom: 16
    },
    backBtn: { marginRight: 16 },
    title: { fontWeight: '900', color: 'white', letterSpacing: -0.5 },
    searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
    searchGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    chipHost: { height: 44, marginBottom: 16 },
    chipScroll: { paddingHorizontal: 24, gap: 10, alignItems: 'center' },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        height: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
    list: { paddingHorizontal: 24, paddingBottom: 40, gap: 14 },
    itemCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    itemImage: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemName: {
        fontWeight: '800',
        color: 'white',
        fontSize: 16,
    },
    tagRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    miniTag: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    miniTagText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '800',
    },
    emptyHost: { alignItems: 'center', marginTop: 80, gap: 12 },
    empty: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
    modal: {
        backgroundColor: '#0A1121',
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalImgContainer: { width: '100%', height: 280, position: 'relative' },
    modalImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
    },
    modalClose: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
    modalMeta: { padding: 24 },
    modalTitle: { fontWeight: '900', color: 'white' },
    modalSub: { color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
    instrHeader: { color: '#4FACFE', fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 12 },
    instrScroll: { maxHeight: 180 },
    instrRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
    instrDot: { color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' },
    instrLine: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20, flex: 1 },
    modalBtn: {
        marginTop: 24,
        backgroundColor: '#4FACFE',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
    },
    modalBtnLabel: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }
});
