import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../utils/api';

// ── Zone definitions ─────────────────────────────────────────────
const ZONES = [
    { id: 'front', label: 'Front', rows: 2, colors: ['#0d9488', '#14b8a6', '#2dd4bf'], border: '#0f766e' },
    { id: 'middle', label: 'Middle', rows: 2, colors: ['#5b21b6', '#7c3aed', '#8b5cf6'], border: '#6d28d9' },
    { id: 'back', label: 'Back', rows: 3, colors: ['#1d4ed8', '#3b82f6', '#60a5fa'], border: '#1e40af' },
];
const COLS = 8;
const MAT_W = 50;
const MAT_H = 22;

// ── Build mat grid ────────────────────────────────────────────────
// bookedLabels: Set<string> of seat labels that are already taken
function buildMats(maxParticipants, bookedLabels) {
    const total = Math.min(maxParticipants || 56, 56);

    const rows = [];

    ZONES.forEach((zone) => {
        for (let r = 0; r < zone.rows; r++) {
            const letter = String.fromCharCode(65 + ZONES.indexOf(zone) * 3 + r);
            const seats = [];
            for (let c = 0; c < COLS; c++) {
                const label = `${letter}${c + 1}`;
                seats.push({
                    id: `${zone.id}-${r}-${c}`,
                    label,
                    rowLetter: letter,
                    zone: zone.id,
                    zoneLabel: zone.label,
                    colors: zone.colors,
                    border: zone.border,
                    booked: bookedLabels.has(label),
                });
            }
            rows.push({ key: `${zone.id}-${r}`, zone: zone.id, zoneLabel: zone.label, colors: zone.colors, letter, seats });
        }
    });

    return rows;
}

function formatPrice(p) {
    if (!p || p === 'Free' || p === '0') return 'Free';
    const n = parseInt(String(p).replace(/[^\d]/g, ''), 10);
    return n ? `₹${n}` : String(p);
}

// ── Single Yoga Mat ───────────────────────────────────────────────
function YogaMat({ colors, border, isSelected, isBooked, isHovered }) {
    const [c1, c2, c3] = colors;

    if (isBooked) {
        return (
            <div style={{
                width: MAT_W, height: MAT_H, borderRadius: 5,
                background: 'linear-gradient(90deg,#7f1d1d,#dc2626 30%,#ef4444 50%,#dc2626 70%,#7f1d1d)',
                border: '1.5px solid #f87171',
                boxShadow: '0 0 6px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
                position: 'relative', overflow: 'hidden',
                opacity: 0.85,
            }}>
                {/* End caps */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
                    background: 'linear-gradient(90deg,rgba(0,0,0,0.25),transparent)',
                    borderRadius: '5px 0 0 5px',
                }} />
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
                    background: 'linear-gradient(270deg,rgba(0,0,0,0.25),transparent)',
                    borderRadius: '0 5px 5px 0',
                }} />
                {/* ✕ icon */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{
                        fontSize: 11, fontWeight: 900, lineHeight: 1,
                        color: 'rgba(255,255,255,0.9)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                    }}>✕</span>
                </div>
            </div>
        );
    }


    const glow = isSelected
        ? `0 0 14px #7c3aed, 0 0 28px #7c3aed66, 0 3px 8px rgba(0,0,0,0.6)`
        : isHovered
            ? `0 0 8px ${c2}99, 0 2px 5px rgba(0,0,0,0.4)`
            : `0 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.14)`;

    const bg = isSelected
        ? `linear-gradient(90deg,#4c1d95,#7c3aed 25%,#a78bfa 50%,#7c3aed 75%,#4c1d95)`
        : `linear-gradient(90deg,${c1},${c2} 25%,${c3} 50%,${c2} 75%,${c1})`;

    return (
        <div style={{
            width: MAT_W, height: MAT_H, borderRadius: 5,
            background: bg,
            border: `1.5px solid ${isSelected ? '#c4b5fd' : border}`,
            boxShadow: glow,
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.12s, background 0.12s, border-color 0.12s',
        }}>
            {/* End-cap highlights (mat edge rolls) */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
                background: isSelected
                    ? 'linear-gradient(90deg,rgba(196,181,253,0.4),transparent)'
                    : `linear-gradient(90deg,rgba(255,255,255,0.25),transparent)`,
                borderRadius: '5px 0 0 5px',
            }} />
            <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 6,
                background: isSelected
                    ? 'linear-gradient(270deg,rgba(196,181,253,0.4),transparent)'
                    : `linear-gradient(270deg,rgba(255,255,255,0.25),transparent)`,
                borderRadius: '0 5px 5px 0',
            }} />

            {/* Grip lines */}
            {!isSelected && [3, MAT_H / 2 - 0.5, MAT_H - 4].map((y, i) => (
                <div key={i} style={{
                    position: 'absolute', top: y, left: 10, right: 10, height: 1,
                    background: 'rgba(255,255,255,0.18)',
                }} />
            ))}

            {/* Selected: lotus pose */}
            {isSelected && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: 12, lineHeight: 1 }}>🧘</span>
                </div>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────
const SeatBookingModal = ({ isOpen, onClose, onSeatConfirmed, event, bookedSeatLabels: externalBooked = [] }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    // Internal state for booked seats – fetched fresh every time modal opens
    const [fetchedBooked, setFetchedBooked] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);

    // Fetch booked seats from backend whenever the modal opens
    useEffect(() => {
        if (!isOpen || !event?._id) return;

        let cancelled = false;
        setFetchedBooked([]);
        setFetchLoading(true);

        // Use the project's api utility (handles auth token automatically)
        api.get(`/location/event-bookings/booked-seats?event_id=${event._id}`)
            .then(res => {
                if (cancelled) return;
                const seats = res.data?.booked_seats || [];
                console.log('🪑 Booked seats from API:', seats);
                setFetchedBooked(seats);
            })
            .catch(err => {
                if (cancelled) return;
                console.warn('Could not fetch booked seats:', err?.response?.data || err.message);
                setFetchedBooked(externalBooked);
            })
            .finally(() => {
                if (!cancelled) setFetchLoading(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, event?._id]);

    // Merge internal fetch with any parent-passed labels (belt-and-suspenders)
    const allBooked = useMemo(
        () => [...new Set([...fetchedBooked, ...externalBooked])],
        [fetchedBooked, externalBooked]
    );

    // Build a Set from the merged booked labels array
    const bookedLabelsSet = useMemo(() => new Set(allBooked), [allBooked]);

    const rows = useMemo(
        () => buildMats(event?.max_participants, bookedLabelsSet),
        [bookedLabelsSet, event?.max_participants]
    );

    const price = formatPrice(event?.price);

    const selectedSeat = useMemo(() => {
        if (!selectedId) return null;
        for (const row of rows) {
            const f = row.seats.find(s => s.id === selectedId);
            if (f) return f;
        }
        return null;
    }, [selectedId, rows]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedSeat) return;
        onSeatConfirmed(selectedSeat);
        setSelectedId(null);
    };

    const handleClose = () => {
        setSelectedId(null);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 70,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 8, background: 'rgba(2,6,23,0.96)',
                }}
            >
                <motion.div
                    initial={{ scale: 0.86, opacity: 0, y: 48 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.86, opacity: 0, y: 48 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: 660, maxHeight: '96vh',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: 22,
                        background: 'linear-gradient(168deg,#0b1120 0%,#0f172a 55%,#0b1120 100%)',
                        boxShadow: '0 0 60px rgba(13,148,136,0.15), 0 0 120px rgba(124,58,237,0.1), 0 40px 80px rgba(0,0,0,0.9)',
                        border: '1px solid rgba(148,163,184,0.1)',
                        overflow: 'hidden',
                    }}
                >
                    {/* ── Header ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '15px 22px',
                        background: 'rgba(0,0,0,0.25)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 22 }}>🧘‍♀️</span>
                                <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 17, margin: 0 }}>
                                    Choose Your Mat
                                </p>
                            </div>
                            <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0 30px' }}>
                                {event?.title || 'Yoga Session'} &nbsp;·&nbsp; {price} per mat
                                {fetchLoading && (
                                    <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 10 }}>
                                        ⏳ Loading availability...
                                    </span>
                                )}
                            </p>
                        </div>
                        <button onClick={handleClose} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                            color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* ── Legend ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22,
                        padding: '7px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        {[
                            { color: '#14b8a6', label: 'Available' },
                            { color: '#7c3aed', label: 'Your Mat' },
                            { color: '#dc2626', label: 'Taken', border: '#f87171' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 24, height: 10, borderRadius: 3,
                                    background: item.color,
                                    border: item.border ? `1px solid ${item.border}` : undefined,
                                }} />
                                <span style={{ color: '#94a3b8', fontSize: 10.5 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── 3-D Studio View ── */}
                    <div style={{ overflowY: 'auto', flex: 1, overflowX: 'hidden' }}>
                        <div style={{
                            padding: '18px 14px 30px',
                            background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 70%)',
                            minHeight: 340,
                        }}>
                            <div style={{ perspective: '1200px', perspectiveOrigin: '50% -5%' }}>
                                <div style={{ transform: 'rotateX(36deg)', transformOrigin: 'top center' }}>

                                    {/* ── Studio room box ── */}
                                    <div style={{
                                        borderRadius: '14px 14px 4px 4px',
                                        overflow: 'hidden',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                                    }}>

                                        {/* Mirror wall + instructor */}
                                        <div style={{
                                            background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 60%,#1a2540 100%)',
                                            padding: '14px 20px 12px',
                                            borderBottom: '3px solid rgba(148,163,184,0.15)',
                                            position: 'relative',
                                            textAlign: 'center',
                                        }}>
                                            {/* Mirror shimmer */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 60px)',
                                                pointerEvents: 'none',
                                            }} />
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(to bottom,rgba(255,255,255,0.035) 0%,transparent 55%)',
                                                pointerEvents: 'none',
                                            }} />

                                            {/* Mirror label */}
                                            <p style={{
                                                margin: '0 0 10px', color: '#94a3b8', fontSize: 9,
                                                fontWeight: 700, letterSpacing: '0.2em',
                                                textShadow: '0 0 10px rgba(148,163,184,0.4)',
                                            }}>
                                                ✨ MIRROR WALL
                                            </p>

                                            {/* Instructor mat */}
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
                                                <div style={{
                                                    width: 90, height: 30,
                                                    background: 'linear-gradient(90deg,#92400e,#f59e0b 20%,#fcd34d 50%,#f59e0b 80%,#92400e)',
                                                    borderRadius: 8,
                                                    border: '2px solid #fde68a',
                                                    boxShadow: '0 0 18px rgba(245,158,11,0.7), 0 0 36px rgba(245,158,11,0.25)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    position: 'relative', overflow: 'hidden',
                                                }}>
                                                    {/* Gold mat grip lines */}
                                                    {[7, 15, 23].map(y => (
                                                        <div key={y} style={{
                                                            position: 'absolute', top: y, left: 10, right: 10, height: 1,
                                                            background: 'rgba(255,255,255,0.25)',
                                                        }} />
                                                    ))}
                                                    <span style={{ fontSize: 16, position: 'relative' }}>🧘‍♀️</span>
                                                </div>
                                            </div>
                                            <p style={{
                                                margin: 0, color: '#f59e0b', fontSize: 8.5,
                                                fontWeight: 700, letterSpacing: '0.18em', opacity: 0.9,
                                            }}>
                                                INSTRUCTOR
                                            </p>
                                        </div>

                                        {/* Wooden studio floor */}
                                        <div style={{
                                            background: [
                                                'linear-gradient(180deg,#2d1f0e 0%,#3d2c17 15%,#4a3520 35%,#3d2c17 55%,#352816 75%,#2d1f0e 100%)',
                                            ].join(','),
                                            padding: '10px 14px 18px',
                                            position: 'relative',
                                        }}>
                                            {/* Subtle wood-grain planks */}
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} style={{
                                                    position: 'absolute', left: 0, right: 0,
                                                    top: `${i * 16.6}%`, height: 1,
                                                    background: 'rgba(255,255,255,0.025)',
                                                }} />
                                            ))}

                                            {/* Mat rows */}
                                            {rows.map((row, rowIdx) => {
                                                const isFirstOfZone = rowIdx === 0 || rows[rowIdx - 1].zone !== row.zone;
                                                return (
                                                    <React.Fragment key={row.key}>
                                                        {/* Section divider */}
                                                        {isFirstOfZone && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                margin: rowIdx === 0 ? '2px 0 6px' : '10px 0 6px',
                                                            }}>
                                                                <div style={{ flex: 1, height: 1, background: `${row.colors[1]}44` }} />
                                                                <span style={{
                                                                    fontSize: 8.5, fontWeight: 700,
                                                                    color: row.colors[1], letterSpacing: '0.15em',
                                                                }}>
                                                                    {row.zoneLabel.toUpperCase()} SECTION  ·  {price}
                                                                </span>
                                                                <div style={{ flex: 1, height: 1, background: `${row.colors[1]}44` }} />
                                                            </div>
                                                        )}

                                                        {/* Row */}
                                                        <div style={{
                                                            display: 'flex', gap: 7, justifyContent: 'center',
                                                            marginBottom: 9, position: 'relative', zIndex: 1,
                                                        }}>
                                                            <span style={{
                                                                width: 12, color: '#4b3f2f', fontSize: 9,
                                                                fontFamily: 'monospace', display: 'flex',
                                                                alignItems: 'center', flexShrink: 0,
                                                            }}>
                                                                {row.letter}
                                                            </span>

                                                            {row.seats.map(seat => {
                                                                // Check LIVE from bookedLabelsSet so red color updates
                                                                // immediately when the fetch resolves, without waiting
                                                                // for the rows useMemo to rebuild.
                                                                const isBooked = bookedLabelsSet.has(seat.label);
                                                                const isSel = !isBooked && seat.id === selectedId;
                                                                const isHov = !isBooked && hoveredId === seat.id;
                                                                return (
                                                                    <button
                                                                        key={seat.id}
                                                                        disabled={isBooked}
                                                                        title={isBooked ? 'Mat taken' : `Mat ${seat.label} · ${price}`}
                                                                        onClick={() => !isBooked && setSelectedId(p => p === seat.id ? null : seat.id)}
                                                                        onMouseEnter={() => !isBooked && setHoveredId(seat.id)}
                                                                        onMouseLeave={() => setHoveredId(null)}
                                                                        style={{
                                                                            background: 'none', border: 'none', padding: 0,
                                                                            cursor: isBooked ? 'not-allowed' : 'pointer',
                                                                            flexShrink: 0,
                                                                            transform: isSel
                                                                                ? 'scale(1.18) translateY(-3px)'
                                                                                : isHov ? 'scale(1.08)' : 'scale(1)',
                                                                            transition: 'transform 0.13s',
                                                                            outline: 'none',
                                                                        }}
                                                                    >
                                                                        <YogaMat
                                                                            colors={seat.colors}
                                                                            border={seat.border}
                                                                            isSelected={isSel}
                                                                            isBooked={isBooked}
                                                                            isHovered={isHov}
                                                                        />
                                                                    </button>
                                                                );
                                                            })}

                                                            <span style={{
                                                                width: 12, color: '#4b3f2f', fontSize: 9,
                                                                fontFamily: 'monospace', display: 'flex',
                                                                alignItems: 'center', flexShrink: 0,
                                                            }}>
                                                                {row.letter}
                                                            </span>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Entrance */}
                                            <div style={{
                                                marginTop: 8, paddingTop: 8,
                                                borderTop: '1px dashed rgba(255,255,255,0.05)',
                                                textAlign: 'center',
                                            }}>
                                                <span style={{ color: '#3d2c17', fontSize: 8, letterSpacing: '0.16em', fontWeight: 600 }}>
                                                    ── ENTRANCE ──
                                                </span>
                                            </div>
                                        </div>
                                    </div>{/* end studio box */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div style={{
                        padding: '13px 22px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(0,0,0,0.3)',
                        minHeight: 60, display: 'flex', alignItems: 'center',
                    }}>
                        {selectedSeat ? (
                            <motion.div
                                key="confirm-bar"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 24 }}>🧘</span>
                                    <div>
                                        <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14, margin: 0 }}>
                                            Mat {selectedSeat.label}
                                            <span style={{
                                                marginLeft: 8, fontSize: 10, padding: '2px 8px', borderRadius: 99,
                                                background: selectedSeat.colors[1] + '33',
                                                color: selectedSeat.colors[1],
                                                border: `1px solid ${selectedSeat.colors[1]}66`,
                                                fontWeight: 700,
                                            }}>
                                                {selectedSeat.zoneLabel}
                                            </span>
                                        </p>
                                        <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0' }}>
                                            {price} · Tap confirm to reserve 🙏
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConfirm}
                                    style={{
                                        padding: '9px 20px', borderRadius: 12, border: 'none', flexShrink: 0,
                                        background: 'linear-gradient(135deg,#0d9488,#0891b2)',
                                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(13,148,136,0.45)',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    Confirm Mat →
                                </button>
                            </motion.div>
                        ) : (
                            <p style={{ color: '#334155', fontSize: 12, margin: 0, width: '100%', textAlign: 'center' }}>
                                🙏 Tap an available mat to reserve your spot
                            </p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SeatBookingModal;
