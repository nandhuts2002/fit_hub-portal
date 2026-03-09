import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { YOGA_POSES, analyzePose, KP } from '../../utils/yogaPoseLibrary';

// ── constants ─────────────────────────────────────────────────────────────────
const SKELETON_CONNECTIONS = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15], [12, 14], [14, 16],
    [0, 1], [0, 2], [1, 3], [2, 4],
];

// ── helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 55) return '#fbbf24';
    return '#ef4444';
}
function scoreLabel(score) {
    if (score >= 80) return 'Great Form!';
    if (score >= 55) return 'Almost There';
    return 'Needs Work';
}
function statusColor(status) {
    if (status === 'good') return '#22c55e';
    if (status === 'warning') return '#fbbf24';
    if (status === 'bad') return '#ef4444';
    return '#94a3b8';
}

// ── component ─────────────────────────────────────────────────────────────────
export default function YogaPoseCorrectorPage() {
    const navigate = useNavigate();

    // refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const rafRef = useRef(null);
    const streamRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis || null);
    const lastSpokenRef = useRef({ text: '', time: 0 });

    // state
    const [loading, setLoading] = useState(true);
    const [loadMsg, setLoadMsg] = useState('Loading AI model…');
    const [cameraReady, setCameraReady] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [selectedPose, setSelectedPose] = useState(YOGA_POSES[0]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [holdTime, setHoldTime] = useState(0);
    const [voiceOn, setVoiceOn] = useState(true);
    const [keypointsVisible, setKeypointsVisible] = useState(0);

    // hold-timer interval
    const holdIntervalRef = useRef(null);

    // voice
    const speak = useCallback((text) => {
        if (!voiceOn || !synthRef.current) return;
        const now = Date.now();
        if (text === lastSpokenRef.current.text && now - lastSpokenRef.current.time < 6000) return;
        if (now - lastSpokenRef.current.time < 4000) return;
        synthRef.current.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.95;
        utt.pitch = 1.05;
        synthRef.current.speak(utt);
        lastSpokenRef.current = { text, time: now };
    }, [voiceOn]);

    // ── init TF + detector ─────────────────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadMsg('Initializing TensorFlow…');
                await tf.ready();
                await tf.setBackend('webgl');
                setLoadMsg('Loading MoveNet model…');
                const detector = await poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER, enableSmoothing: true }
                );
                if (!alive) return;
                detectorRef.current = detector;
                setLoadMsg('Starting camera…');
                await startCamera();
                setLoading(false);
            } catch (e) {
                if (alive) { setError('Failed to load AI model: ' + e.message); setLoading(false); }
            }
        })();

        return () => {
            alive = false;
            stopCamera();
            if (detectorRef.current) detectorRef.current.dispose?.();
            cancelAnimationFrame(rafRef.current);
        };
    }, []); // eslint-disable-line

    // ── camera ─────────────────────────────────────────────────────────────────
    async function startCamera() {
        try {
            setError('');
            // Relaxed constraints for better compatibility
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const s = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = s;
            setCameraReady(true);
        } catch (e) {
            console.error("Camera error:", e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                setError('Camera access denied. Please allow camera permissions in your browser settings.');
            } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
                setError('No camera found on this device.');
            } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
                setError('Camera is already in use by another application.');
            } else {
                setError('Camera error: ' + e.message);
            }
        }
    }

    // ── attach stream to video element when ready ─────────────────────────────
    useEffect(() => {
        if (cameraReady && streamRef.current && videoRef.current) {
            const video = videoRef.current;
            if (video.srcObject !== streamRef.current) {
                video.srcObject = streamRef.current;
                video.onloadedmetadata = () => {
                    video.play().catch(e => console.error("Play error:", e));
                };
            }
        }
    }, [cameraReady]);

    function stopCamera() {
        streamRef.current?.getTracks().forEach(t => t.stop());
        setCameraReady(false);
    }

    // ── detection loop ─────────────────────────────────────────────────────────
    const runDetection = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const detector = detectorRef.current;
        if (!video || !canvas || !detector || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(runDetection);
            return;
        }

        // sync canvas size
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const poses = await detector.estimatePoses(video);
            if (poses.length > 0 && poses[0].keypoints) {
                const kps = poses[0].keypoints;
                const visible = kps.filter(k => k.score > 0.25).length;
                setKeypointsVisible(visible);

                // analyze against selected pose
                const result = analyzePose(selectedPose, kps);
                setAnalysisResult(result);

                // voice tip every few seconds for top issue
                const worst = result.checks
                    .filter(c => c.status !== 'good' && c.status !== 'unknown')
                    .sort((a, b) => a.score - b.score)[0];
                if (worst) speak(worst.message);
                else if (result.score >= 80) speak('Great form! Hold the pose.');

                // draw skeleton colored per overall score
                drawSkeleton(ctx, kps, result);
            } else {
                setKeypointsVisible(0);
                setAnalysisResult(null);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        } catch (_) { /* ignore per-frame errors */ }

        rafRef.current = requestAnimationFrame(runDetection);
    }, [selectedPose, speak]);

    // restart loop when pose selection changes or analysis toggles
    useEffect(() => {
        if (!analyzing || !cameraReady) {
            cancelAnimationFrame(rafRef.current);
            clearInterval(holdIntervalRef.current);
            return;
        }
        setHoldTime(0);
        holdIntervalRef.current = setInterval(() => setHoldTime(t => t + 1), 1000);
        rafRef.current = requestAnimationFrame(runDetection);
        return () => {
            cancelAnimationFrame(rafRef.current);
            clearInterval(holdIntervalRef.current);
        };
    }, [analyzing, cameraReady, runDetection]);

    // clear canvas when stopped
    useEffect(() => {
        if (!analyzing && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }, [analyzing]);

    // ── draw skeleton ──────────────────────────────────────────────────────────
    function drawSkeleton(ctx, kps, result) {
        const score = result?.score ?? 100;
        const mainColor = scoreColor(score);

        // draw connections
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        SKELETON_CONNECTIONS.forEach(([i, j]) => {
            const a = kps[i], b = kps[j];
            if (a && b && a.score > 0.25 && b.score > 0.25) {
                ctx.strokeStyle = mainColor;
                ctx.shadowColor = mainColor;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        // draw keypoints
        kps.forEach((kp, i) => {
            if (kp.score < 0.25) return;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = mainColor;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
        });
    }

    // ── pose selection resets state ────────────────────────────────────────────
    function selectPose(pose) {
        setSelectedPose(pose);
        setAnalysisResult(null);
        setHoldTime(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)', fontFamily: "'Inter', sans-serif" }}>

            {/* ── header ── */}
            <header style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30, background: 'rgba(15,12,41,0.85)' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#a0aec0', cursor: 'pointer', fontSize: 18 }}>←</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>🧘 AI Yoga Pose Corrector</h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#718096' }}>Real-time camera · MoveNet AI · Instant feedback</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    {/* voice toggle */}
                    <button
                        onClick={() => setVoiceOn(v => !v)}
                        title={voiceOn ? 'Mute voice' : 'Enable voice'}
                        style={{ background: voiceOn ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: voiceOn ? '#818cf8' : '#4a5568', cursor: 'pointer', fontSize: 16 }}>
                        {voiceOn ? '🔊' : '🔇'}
                    </button>
                </div>
            </header>

            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#e2e8f0' }}>
                    <div style={{ width: 56, height: 56, border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                    <p style={{ fontSize: 16, color: '#a0aec0' }}>{loadMsg}</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {error && !loading && (
                <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center', color: '#fc8181', background: 'rgba(254,178,178,0.08)', border: '1px solid rgba(252,129,129,0.3)', borderRadius: 16, padding: 32 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ margin: '0 0 8px' }}>Camera Error</h2>
                    <p style={{ margin: 0, color: '#fc8181', fontSize: 14 }}>{error}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 24px', background: '#6366f1', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
                </div>
            )}

            {!loading && !error && (
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 24 }}>

                    {/* ── left: camera ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* camera card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'relative', aspectRatio: '4/3', background: '#000' }}>
                                <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />

                                {/* overlays when analyzing */}
                                {analyzing && (
                                    <>
                                        {/* score badge top-left */}
                                        {analysisResult && (
                                            <div style={{ position: 'absolute', top: 14, left: 14, background: `linear-gradient(135deg, ${scoreColor(analysisResult.score)}22, ${scoreColor(analysisResult.score)}44)`, border: `2px solid ${scoreColor(analysisResult.score)}`, borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(8px)' }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(analysisResult.score), lineHeight: 1 }}>{analysisResult.score}%</div>
                                                <div style={{ fontSize: 11, color: '#e2e8f0', marginTop: 2 }}>{scoreLabel(analysisResult.score)}</div>
                                            </div>
                                        )}

                                        {/* live badge + keypoints top-right */}
                                        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                            <div style={{ background: '#ef4444', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite', display: 'inline-block' }} />
                                                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>LIVE</span>
                                            </div>
                                            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', color: '#e2e8f0', fontSize: 11 }}>
                                                {keypointsVisible}/17 pts
                                            </div>
                                            {holdTime > 0 && (
                                                <div style={{ background: 'rgba(99,102,241,0.7)', borderRadius: 8, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                                                    ⏱ {holdTime}s
                                                </div>
                                            )}
                                        </div>

                                        {/* worst correction banner bottom */}
                                        {analysisResult && (() => {
                                            const worst = analysisResult.checks
                                                .filter(c => c.status !== 'good')
                                                .sort((a, b) => a.score - b.score)[0];
                                            return worst ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                    key={worst.id}
                                                    style={{ position: 'absolute', bottom: 14, left: 14, right: 14, background: `${statusColor(worst.status)}dd`, borderRadius: 14, padding: '12px 16px', backdropFilter: 'blur(8px)' }}>
                                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{worst.label}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 }}>{worst.message}</div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                    style={{ position: 'absolute', bottom: 14, left: 14, right: 14, background: 'rgba(34,197,94,0.85)', borderRadius: 14, padding: '12px 16px', backdropFilter: 'blur(8px)' }}>
                                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>✨ Perfect Form! Hold it!</div>
                                                </motion.div>
                                            );
                                        })()}
                                    </>
                                )}

                                {/* not analyzing placeholder */}
                                {!analyzing && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                                        <span style={{ fontSize: 56, marginBottom: 12 }}>{selectedPose.emoji}</span>
                                        <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 16, margin: 0 }}>Ready to analyze</p>
                                        <p style={{ color: '#718096', fontSize: 13, margin: '4px 0 0' }}>Press Start to begin</p>
                                    </div>
                                )}
                            </div>

                            {/* controls */}
                            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.4)' }}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setAnalyzing(a => !a); if (analyzing) setAnalysisResult(null); }}
                                    disabled={!cameraReady}
                                    style={{
                                        flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: cameraReady ? 'pointer' : 'not-allowed', opacity: cameraReady ? 1 : 0.5,
                                        background: analyzing ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: '#fff', boxShadow: analyzing ? '0 4px 20px rgba(239,68,68,0.4)' : '0 4px 20px rgba(99,102,241,0.4)'
                                    }}>
                                    {analyzing ? '⏹ Stop Analysis' : '▶ Start Analysis'}
                                </motion.button>
                                {analyzing && (
                                    <button onClick={() => { setAnalysisResult(null); setHoldTime(0); }} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#a0aec0', cursor: 'pointer', fontWeight: 600 }}>
                                        ↺ Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── pose description ── */}
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontSize: 28 }}>{selectedPose.emoji}</span>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{selectedPose.name}</div>
                                    <span style={{ background: selectedPose.difficulty === 'Beginner' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: selectedPose.difficulty === 'Beginner' ? '#4ade80' : '#fbbf24', fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>{selectedPose.difficulty}</span>
                                </div>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{selectedPose.description}</p>
                        </div>
                    </div>

                    {/* ── right panel ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* pose picker */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
                            <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>Choose Pose</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {YOGA_POSES.map(pose => (
                                    <motion.button
                                        key={pose.id}
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => selectPose(pose)}
                                        style={{
                                            padding: '10px 6px', borderRadius: 12, border: selectedPose.id === pose.id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                                            background: selectedPose.id === pose.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                                        }}>
                                        <span style={{ fontSize: 22 }}>{pose.emoji}</span>
                                        <span style={{ color: selectedPose.id === pose.id ? '#818cf8' : '#94a3b8', fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{pose.name}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* joint checks */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
                            <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>
                                Joint Checks
                                {analysisResult && (
                                    <span style={{ marginLeft: 10, fontSize: 12, color: scoreColor(analysisResult.score) }}>
                                        {analysisResult.score}% match
                                    </span>
                                )}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(analysisResult?.checks || selectedPose.checks.map(c => ({ ...c, status: 'unknown', message: 'Start analysis to see feedback', score: 50, angle: null }))).map(check => (
                                    <div
                                        key={check.id}
                                        style={{ background: `${statusColor(check.status)}11`, border: `1px solid ${statusColor(check.status)}33`, borderRadius: 12, padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{check.label}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {check.angle !== null && (
                                                    <span style={{ color: '#718096', fontSize: 11 }}>{check.angle}°</span>
                                                )}
                                                <span style={{ fontSize: 13 }}>
                                                    {check.status === 'good' ? '✅' : check.status === 'warning' ? '⚠️' : check.status === 'bad' ? '❌' : '⬜'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* score bar */}
                                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                                            <motion.div
                                                animate={{ width: `${check.score || 50}%` }}
                                                transition={{ duration: 0.4 }}
                                                style={{ height: '100%', background: `linear-gradient(90deg, ${statusColor(check.status)}, ${statusColor(check.status)}aa)`, borderRadius: 4 }} />
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                                            {check.message || check.tip}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* tips card */}
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 18, padding: 16 }}>
                            <h3 style={{ margin: '0 0 10px', color: '#818cf8', fontSize: 13, fontWeight: 700 }}>💡 Quick Tips</h3>
                            <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#94a3b8', fontSize: 12, lineHeight: 1.8 }}>
                                <li>Stand 4–6 feet from camera, full body visible</li>
                                <li>Good lighting helps the AI see you better</li>
                                <li>Wear fitted clothing for accurate detection</li>
                                <li>Hold each pose for at least 10 seconds</li>
                                <li>Green = perfect · Yellow = almost · Red = adjust</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 'minmax(0,1.4fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
