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

const YOGA_CATEGORIES = [
    'all', 'standing', 'seated', 'backbends', 'forward-bends',
    'inversions', 'twists', 'restorative', 'balance'
];

interface YogaPose {
    id: number;
    name: string;
    english_name: string;
    sanskrit_name: string;
    imageUrl: string;
    pose_benefits: string;
    pose_description: string;
    category: string;
    level: string;
}

export function YogaExplorerScreen() {
    const navigation = useNavigation<any>();
    const [poses, setPoses] = useState<YogaPose[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPose, setSelectedPose] = useState<YogaPose | null>(null);

    const fetchYogaData = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://yoga-api-nzy4.onrender.com/v1/poses');
            const data = await response.json();

            const processed = data.map((p: any) => ({
                ...p,
                imageUrl: p.url_png || p.url_svg || p.img_url,
                name: p.english_name,
                category: p.category_name?.toLowerCase() || 'standing',
                level: p.level || 'beginner'
            }));
            setPoses(processed);
        } catch (err) {
            console.error('Error fetching yoga data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYogaData();
    }, []);

    const filteredPoses = poses.filter(p => {
        const matchesSearch = !search ||
            p.english_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.sanskrit_name?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'all' ||
            p.category?.includes(selectedCategory);

        return matchesSearch && matchesCategory;
    });

    const renderPose = ({ item }: { item: YogaPose }) => {
        return (
            <Surface style={styles.itemCard} elevation={0}>
                <TouchableRipple
                    onPress={() => setSelectedPose(item)}
                    rippleColor="rgba(16, 185, 129, 0.1)"
                    style={{ flex: 1 }}
                >
                    <View style={styles.itemContent}>
                        <View style={styles.imageBox}>
                            <Image
                                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                                style={styles.itemImage}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text variant="titleMedium" numberOfLines={1} style={styles.itemName}>
                                {item.english_name}
                            </Text>
                            <Text style={styles.sanskrit}>{item.sanskrit_name}</Text>
                            <View style={styles.tagRow}>
                                <Surface style={styles.miniTag} elevation={0}>
                                    <Text style={styles.miniTagText}>{item.level}</Text>
                                </Surface>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="leaf" size={20} color="rgba(16, 185, 129, 0.4)" />
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
                    <Text variant="headlineSmall" style={styles.title}>Yoga Studio</Text>
                </View>

                <View style={styles.searchContainer}>
                    <Surface style={styles.searchGlass} elevation={0}>
                        <MaterialCommunityIcons name="magnify" size={22} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            placeholder="Find your zen..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </Surface>
                </View>

                <View style={styles.chipHost}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {YOGA_CATEGORIES.map((cat) => (
                            <Chip
                                key={cat}
                                selected={selectedCategory === cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    styles.chip,
                                    selectedCategory === cat && { backgroundColor: '#10B981' }
                                ]}
                                textStyle={[
                                    styles.chipText,
                                    selectedCategory === cat && { color: 'white' }
                                ]}
                                showSelectedOverlay={false}
                            >
                                {cat.toUpperCase().replace('-', ' ')}
                            </Chip>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator color="#10B981" style={{ marginTop: 60 }} />
                ) : (
                    <FlatList
                        data={filteredPoses}
                        renderItem={renderPose}
                        keyExtractor={(it, idx) => it.id?.toString() || idx.toString()}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyHost}>
                                <MaterialCommunityIcons name="leaf" size={48} color="rgba(16, 185, 129, 0.1)" />
                                <Text style={styles.empty}>No poses found</Text>
                            </View>
                        }
                    />
                )}

                <Portal>
                    <Modal
                        visible={!!selectedPose}
                        onDismiss={() => setSelectedPose(null)}
                        contentContainerStyle={styles.modal}
                    >
                        {selectedPose && (
                            <View>
                                <View style={styles.modalImgContainer}>
                                    <Image source={{ uri: selectedPose.imageUrl }} style={styles.modalImage} resizeMode="contain" />
                                    <IconButton
                                        icon="close"
                                        style={styles.modalClose}
                                        onPress={() => setSelectedPose(null)}
                                        containerColor="rgba(0,0,0,0.5)"
                                        iconColor="white"
                                    />
                                </View>
                                <View style={styles.modalMeta}>
                                    <Text variant="headlineSmall" style={styles.modalEnglish}>{selectedPose.english_name}</Text>
                                    <Text style={styles.modalSanskrit}>{selectedPose.sanskrit_name}</Text>

                                    <View style={styles.divider} />

                                    <Text variant="titleMedium" style={styles.benefitsHeader}>BENEFITS</Text>
                                    <ScrollView style={styles.benefitsScroll} showsVerticalScrollIndicator={false}>
                                        <Text style={styles.bodyText}>{selectedPose.pose_benefits}</Text>
                                    </ScrollView>

                                    <Button
                                        mode="contained"
                                        style={styles.modalBtn}
                                        labelStyle={styles.modalBtnLabel}
                                        onPress={() => {
                                            setSelectedPose(null);
                                            navigation.navigate('PostureCorrection', {
                                                type: selectedPose.english_name,
                                                name: selectedPose.english_name,
                                                mode: 'yoga'
                                            });
                                        }}
                                    >
                                        Start Practice
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
    imageBox: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: 'white',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemImage: {
        width: '100%',
        height: '100%',
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
    sanskrit: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
        marginTop: 2,
    },
    tagRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    miniTag: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    miniTagText: {
        fontSize: 10,
        color: '#34D399',
        fontWeight: '800',
    },
    emptyHost: { alignItems: 'center', marginTop: 80, gap: 12 },
    empty: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
    modal: {
        backgroundColor: '#050B14',
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalImgContainer: {
        height: 280,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    modalImage: {
        width: '80%',
        height: '80%',
    },
    modalClose: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
    modalMeta: { padding: 24 },
    modalEnglish: { fontWeight: '900', color: 'white' },
    modalSanskrit: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
    benefitsHeader: { color: '#10B981', fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 12 },
    benefitsScroll: { maxHeight: 180 },
    bodyText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
    modalBtn: {
        marginTop: 24,
        backgroundColor: '#10B981',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
    },
    modalBtnLabel: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5 }
});
