/**
 * Yoga Pose Library
 * Defines ideal joint angles for common yoga poses.
 * Each pose has an array of "checks" — each check tests one body angle
 * against an ideal range and provides a correction tip if out of range.
 *
 * Angles are computed using calculateAngle(p1, vertex, p3) → degrees (0-180).
 * The camera image is mirrored (scaleX(-1)) so left/right appear correctly
 * to the user but in the skeleton the LEFT keypoints are visually on the
 * right of the frame. All feedback is written from the user's perspective.
 */

// ── helpers ────────────────────────────────────────────────────────────────

/** MoveNet keypoint name → index */
export const KP = {
    nose: 0,
    left_eye: 1, right_eye: 2,
    left_ear: 3, right_ear: 4,
    left_shoulder: 5, right_shoulder: 6,
    left_elbow: 7, right_elbow: 8,
    left_wrist: 9, right_wrist: 10,
    left_hip: 11, right_hip: 12,
    left_knee: 13, right_knee: 14,
    left_ankle: 15, right_ankle: 16,
};

/**
 * Extract a keypoint from the flat array by name.
 * Returns null if confidence < threshold.
 */
export function kp(keypoints, name, conf = 0.25) {
    const k = keypoints[KP[name]];
    return k && k.score >= conf ? k : null;
}

/**
 * Angle at vertex formed by p1–vertex–p3 (degrees).
 */
export function angleDeg(p1, vertex, p3) {
    if (!p1 || !vertex || !p3) return null;
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p3.x - vertex.x, y: p3.y - vertex.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
    if (mag === 0) return null;
    return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

// ── pose definitions ────────────────────────────────────────────────────────

/**
 * Each pose:
 *   id, name, emoji, description, difficulty
 *   checks: Array of {
 *     id, label,
 *     measure(keypoints) → number | null,
 *     ideal: [min, max],          // ideal range in degrees
 *     tip, tooLow, tooHigh        // correction messages
 *   }
 */
export const YOGA_POSES = [
    // ── Warrior I ─────────────────────────────────────────────────────────────
    {
        id: 'warrior1',
        name: 'Warrior I',
        emoji: '🥋',
        description: 'Front knee bent 90°, back leg straight, arms raised overhead, hips square.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'front_knee',
                label: 'Front Knee',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [80, 100],
                tip: 'Bend your front knee to 90°',
                tooLow: 'Your front knee is bent too much — straighten slightly',
                tooHigh: 'Bend your front knee deeper until thigh is parallel to ground',
            },
            {
                id: 'back_leg',
                label: 'Back Leg',
                measure: (kps) => angleDeg(kp(kps, 'right_hip'), kp(kps, 'right_knee'), kp(kps, 'right_ankle')),
                ideal: [160, 180],
                tip: 'Straighten your back leg fully',
                tooLow: 'Straighten your back leg — keep it extended behind you',
                tooHigh: null,
            },
            {
                id: 'torso_upright',
                label: 'Torso',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip'), lk = kp(kps, 'left_knee');
                    return angleDeg(ls, lh, lk);
                },
                ideal: [150, 180],
                tip: 'Keep your torso upright and tall',
                tooLow: 'Stand taller — lift your chest and lengthen your spine',
                tooHigh: null,
            },
            {
                id: 'arms_overhead',
                label: 'Arms Overhead',
                measure: (kps) => {
                    const lw = kp(kps, 'left_wrist'), ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip');
                    return angleDeg(lw, ls, lh);
                },
                ideal: [150, 180],
                tip: 'Reach both arms straight overhead',
                tooLow: 'Raise your arms higher — stretch them toward the ceiling',
                tooHigh: null,
            },
        ],
    },

    // ── Warrior II ────────────────────────────────────────────────────────────
    {
        id: 'warrior2',
        name: 'Warrior II',
        emoji: '⚔️',
        description: 'Front knee at 90°, arms extended parallel to ground, gaze over front hand.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'front_knee',
                label: 'Front Knee',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [80, 100],
                tip: 'Bend front knee to 90°',
                tooLow: 'Ease up slightly on your front knee bend',
                tooHigh: 'Bend your front knee deeper to reach 90°',
            },
            {
                id: 'arms_parallel',
                label: 'Arms Level',
                measure: (kps) => {
                    const lw = kp(kps, 'left_wrist'), ls = kp(kps, 'left_shoulder'), rw = kp(kps, 'right_wrist');
                    if (!lw || !ls || !rw) return null;
                    // Angle between the two extended arms — should be ~180° (fully extended opposite)
                    return angleDeg(lw, ls, rw);
                },
                ideal: [160, 180],
                tip: 'Extend both arms parallel to the ground',
                tooLow: 'Open your arms wider — reach hands away from each other',
                tooHigh: null,
            },
            {
                id: 'shoulder_level',
                label: 'Shoulder Level',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), rs = kp(kps, 'right_shoulder');
                    if (!ls || !rs) return null;
                    return 180 - Math.abs(Math.atan2(rs.y - ls.y, rs.x - ls.x) * 180 / Math.PI);
                },
                ideal: [160, 180],
                tip: 'Keep shoulders level',
                tooLow: 'Level your shoulders — don\'t let one rise higher than the other',
                tooHigh: null,
            },
        ],
    },

    // ── Tree Pose ─────────────────────────────────────────────────────────────
    {
        id: 'tree',
        name: 'Tree Pose',
        emoji: '🌳',
        description: 'Stand on one leg, other foot on inner thigh/calf, arms above head or at chest.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'standing_leg',
                label: 'Standing Leg',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [165, 180],
                tip: 'Keep your standing leg straight',
                tooLow: 'Straighten your standing leg without locking the knee',
                tooHigh: null,
            },
            {
                id: 'lifted_knee',
                label: 'Lifted Knee',
                measure: (kps) => {
                    const rh = kp(kps, 'right_hip'), rk = kp(kps, 'right_knee'), ra = kp(kps, 'right_ankle');
                    return angleDeg(rh, rk, ra);
                },
                ideal: [30, 80],
                tip: 'Bend your lifted knee to the side',
                tooLow: 'Your lifted knee is too compressed — open your hip more',
                tooHigh: 'Bend your raised knee more and press foot to standing leg',
            },
            {
                id: 'torso_upright',
                label: 'Torso',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip'), lk = kp(kps, 'left_knee');
                    return angleDeg(ls, lh, lk);
                },
                ideal: [150, 180],
                tip: 'Stand tall — lengthen your spine',
                tooLow: 'Lengthen your spine — don\'t lean forward',
                tooHigh: null,
            },
        ],
    },

    // ── Downward Dog ──────────────────────────────────────────────────────────
    {
        id: 'downdog',
        name: 'Downward Dog',
        emoji: '🐾',
        description: 'Inverted V-shape: hands & feet on floor, hips high, back and legs straight.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'hip_angle',
                label: 'Hip Angle',
                measure: (kps) => angleDeg(kp(kps, 'left_shoulder'), kp(kps, 'left_hip'), kp(kps, 'left_knee')),
                ideal: [75, 110],
                tip: 'Push hips up and back to form an inverted V',
                tooLow: 'Push your hips higher toward the ceiling',
                tooHigh: 'Send your hips back and up more',
            },
            {
                id: 'back_flat',
                label: 'Spine',
                measure: (kps) => angleDeg(kp(kps, 'left_wrist'), kp(kps, 'left_shoulder'), kp(kps, 'left_hip')),
                ideal: [155, 180],
                tip: 'Keep your back flat and straight',
                tooLow: 'Flatten your back — don\'t round your spine',
                tooHigh: null,
            },
            {
                id: 'leg_straight',
                label: 'Legs',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [155, 180],
                tip: 'Straighten your legs (bend if hamstrings are tight)',
                tooLow: 'Try to straighten your legs, or keep a slight bend if needed',
                tooHigh: null,
            },
        ],
    },

    // ── Chair Pose ────────────────────────────────────────────────────────────
    {
        id: 'chair',
        name: 'Chair Pose',
        emoji: '🪑',
        description: 'Feet together, knees bent as if sitting in a chair, arms raised overhead.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'knee_bend',
                label: 'Knee Bend',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [90, 115],
                tip: 'Bend knees as if sitting in an invisible chair',
                tooLow: 'Your knees are very compressed — rise slightly',
                tooHigh: 'Sit deeper — bend your knees more toward 90°',
            },
            {
                id: 'arms_up',
                label: 'Arms',
                measure: (kps) => angleDeg(kp(kps, 'left_elbow'), kp(kps, 'left_shoulder'), kp(kps, 'left_hip')),
                ideal: [140, 180],
                tip: 'Raise both arms straight overhead',
                tooLow: 'Raise your arms higher alongside your ears',
                tooHigh: null,
            },
            {
                id: 'torso',
                label: 'Forward Lean',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip'), lk = kp(kps, 'left_knee');
                    return angleDeg(ls, lh, lk);
                },
                ideal: [110, 150],
                tip: 'Slight forward lean is OK — keep chest lifted',
                tooLow: 'Don\'t lean so far forward — lift your chest',
                tooHigh: 'Lean forward slightly from your hips to counterbalance',
            },
        ],
    },

    // ── Triangle Pose ─────────────────────────────────────────────────────────
    {
        id: 'triangle',
        name: 'Triangle Pose',
        emoji: '🔺',
        description: 'Legs wide, front leg straight, side-bend over front leg, arms in T-shape.',
        difficulty: 'Intermediate',
        checks: [
            {
                id: 'front_leg',
                label: 'Front Leg',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [165, 180],
                tip: 'Keep your front leg straight',
                tooLow: 'Straighten your front leg — micro-bend is OK but aim for straight',
                tooHigh: null,
            },
            {
                id: 'side_bend',
                label: 'Side Bend',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip'), lk = kp(kps, 'left_knee');
                    return angleDeg(ls, lh, lk);
                },
                ideal: [80, 120],
                tip: 'Side-bend deeply over your front leg',
                tooLow: 'Bend less — keep your waist long',
                tooHigh: 'Reach your hand further down toward the floor',
            },
            {
                id: 'arms_open',
                label: 'Arms',
                measure: (kps) => angleDeg(kp(kps, 'left_wrist'), kp(kps, 'left_shoulder'), kp(kps, 'right_wrist')),
                ideal: [155, 180],
                tip: 'Stack arms vertically — one down, one up',
                tooLow: 'Open your arms more — reach up and down',
                tooHigh: null,
            },
        ],
    },

    // ── Warrior III ───────────────────────────────────────────────────────────
    {
        id: 'warrior3',
        name: 'Warrior III',
        emoji: '✈️',
        description: 'Balance on one leg, body parallel to ground, arms forward, back leg extended.',
        difficulty: 'Intermediate',
        checks: [
            {
                id: 'standing_leg',
                label: 'Standing Leg',
                measure: (kps) => angleDeg(kp(kps, 'left_hip'), kp(kps, 'left_knee'), kp(kps, 'left_ankle')),
                ideal: [160, 180],
                tip: 'Keep standing leg straight (soft bend is OK)',
                tooLow: 'Straighten your standing leg more',
                tooHigh: null,
            },
            {
                id: 'body_parallel',
                label: 'Body Alignment',
                measure: (kps) => {
                    // Angle of shoulder-hip line relative to keypoints
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip');
                    if (!ls || !lh) return null;
                    return Math.abs(Math.atan2(lh.y - ls.y, lh.x - ls.x) * 180 / Math.PI);
                },
                ideal: [0, 25],
                tip: 'Keep your body parallel to the ground',
                tooLow: null,
                tooHigh: 'Tip your torso more forward until it\'s parallel to the ground',
            },
            {
                id: 'lifted_leg',
                label: 'Lifted Leg',
                measure: (kps) => angleDeg(kp(kps, 'right_hip'), kp(kps, 'right_knee'), kp(kps, 'right_ankle')),
                ideal: [160, 180],
                tip: 'Extend your back leg straight behind you',
                tooLow: 'Straighten your lifted leg fully',
                tooHigh: null,
            },
        ],
    },

    // ── Boat Pose ─────────────────────────────────────────────────────────────
    {
        id: 'boat',
        name: 'Boat Pose',
        emoji: '🚣',
        description: 'Seated, lift legs to 45°, arms extended forward parallel to ground, V-shape with body.',
        difficulty: 'Intermediate',
        checks: [
            {
                id: 'leg_angle',
                label: 'Leg Lift',
                measure: (kps) => {
                    const lh = kp(kps, 'left_hip'), lk = kp(kps, 'left_knee'), la = kp(kps, 'left_ankle');
                    // Angle of thigh above horizontal
                    if (!lh || !lk) return null;
                    return 180 - angleDeg(la || lk, lh, { x: lh.x + 100, y: lh.y });
                },
                ideal: [30, 60],
                tip: 'Lift legs to about 45° from the ground',
                tooLow: 'Raise your legs higher',
                tooHigh: 'Lower your legs slightly — aim for 45°',
            },
            {
                id: 'spine_straight',
                label: 'Spine',
                measure: (kps) => {
                    const ls = kp(kps, 'left_shoulder'), lh = kp(kps, 'left_hip');
                    const rs = kp(kps, 'right_shoulder'), rh = kp(kps, 'right_hip');
                    if (!ls || !lh) return null;
                    // torso lean angle
                    return 90 - Math.abs(Math.atan2(lh.y - ls.y, lh.x - ls.x) * 180 / Math.PI);
                },
                ideal: [25, 55],
                tip: 'Lean back slightly — keep spine long, not rounded',
                tooLow: 'Sit taller — lengthen your spine and open your chest',
                tooHigh: 'Lean back a little more to balance in the V-shape',
            },
            {
                id: 'arms_forward',
                label: 'Arms',
                measure: (kps) => angleDeg(kp(kps, 'left_elbow'), kp(kps, 'left_shoulder'), kp(kps, 'left_hip')),
                ideal: [70, 110],
                tip: 'Reach both arms forward, parallel to legs',
                tooLow: 'Raise your arms a bit — align them with your legs',
                tooHigh: 'Lower your arms slightly to be parallel to the ground',
            },
        ],
    },
];

// ── scoring helper ──────────────────────────────────────────────────────────

/**
 * Given a pose definition and live keypoints, run all angle checks.
 * Returns { score 0-100, checks: [{...check, angle, status, message}] }
 */
export function analyzePose(pose, keypoints) {
    let totalScore = 0;
    const results = pose.checks.map((check) => {
        const angle = check.measure(keypoints);

        if (angle === null) {
            return {
                ...check,
                angle: null,
                status: 'unknown',
                message: `Cannot see ${check.label} — adjust your position`,
                score: 50,
            };
        }

        const [min, max] = check.ideal;
        const inRange = angle >= min && angle <= max;

        let status, message, score;
        if (inRange) {
            status = 'good';
            message = `${check.label}: ✓ Great!`;
            score = 100;
        } else if (angle < min) {
            // how far below
            const diff = min - angle;
            status = diff > 20 ? 'bad' : 'warning';
            message = check.tooLow || check.tip;
            score = Math.max(0, 100 - diff * 2);
        } else {
            const diff = angle - max;
            status = diff > 20 ? 'bad' : 'warning';
            message = check.tooHigh || check.tip;
            score = Math.max(0, 100 - diff * 2);
        }

        totalScore += score;
        return { ...check, angle: Math.round(angle), status, message, score };
    });

    const overallScore = Math.round(totalScore / pose.checks.length);
    return { score: overallScore, checks: results };
}
