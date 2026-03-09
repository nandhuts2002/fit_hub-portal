import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Text, IconButton, ProgressBar } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PostureValidator, analyzeYogaPose, YOGA_POSES, Keypoint } from '../../utils/postureCorrection';
import { colors } from '../../theme';

export function PostureCorrectionScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { type, name, mode } = route.params;

    const [permission, requestPermission] = useCameraPermissions();
    const [feedback, setFeedback] = useState('Position yourself in view');
    const [score, setScore] = useState(0);
    const validator = useRef(new PostureValidator());

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    // Mock pose detection loop (for UI demonstration)
    // In a real implementation, we would use TensorFlow.js or a native module
    useEffect(() => {
        const interval = setInterval(() => {
            // simulate score updates
            setScore(prev => Math.min(1, prev + 0.01));
            if (score > 0.8) setFeedback('Great form! Hold it.');
        }, 1000);
        return () => clearInterval(interval);
    }, [score]);

    if (!permission) return <View style={styles.center}><Text>Requesting permission...</Text></View>;
    if (!permission.granted) return (
        <View style={styles.center}>
            <Text>No access to camera</Text>
            <TouchableOpacity onPress={requestPermission}><Text>Grant Permission</Text></TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing="front" />

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <IconButton icon="close" iconColor="white" size={28} onPress={() => navigation.goBack()} />
                    <View>
                        <Text variant="titleLarge" style={styles.poseName}>{name}</Text>
                        <Text style={styles.modeText}>{mode === 'yoga' ? 'Yoga Mode' : 'Exercise Mode'}</Text>
                    </View>
                </View>

                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Accuracy</Text>
                        <ProgressBar progress={score} color={colors.primary2} style={styles.progress} />
                        <Text style={styles.scoreValue}>{Math.round(score * 100)}%</Text>
                    </View>
                </View>

                <View style={styles.skeletonPlaceholder}>
                    <MaterialCommunityIcons name="human" size={100} color="rgba(255,255,255,0.2)" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    camera: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg0 },
    overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 40, justifyContent: 'space-between' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    poseName: { color: 'white', fontWeight: '900' },
    modeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textTransform: 'uppercase' },
    feedbackContainer: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    feedbackText: { color: 'white', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scoreLabel: { color: 'white', fontSize: 12, width: 60 },
    progress: { flex: 1, height: 8, borderRadius: 4 },
    scoreValue: { color: colors.primary2, fontWeight: '900', width: 40, textAlign: 'right' },
    skeletonPlaceholder: { alignSelf: 'center', opacity: 0.5 },
});
