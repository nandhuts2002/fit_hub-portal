/**
 * Posture Correction Utilities
 * Ported from web client to React Native (TypeScript)
 */

export interface Point {
    x: number;
    y: number;
}

export interface Keypoint {
    name: string;
    x: number;
    y: number;
    score: number;
}

export interface PostureViolation {
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
}

export interface PostureResult {
    isValid: boolean;
    feedback: string;
    score: number;
    violations: PostureViolation[];
}

// --- Geometry Utils ---

export function calculateAngle(p1: Point | null, p2: Point | null, p3: Point | null): number | null {
    if (!p1 || !p2 || !p3) return null;
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
    if (mag1 === 0 || mag2 === 0) return null;
    const cosAngle = dot / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return (angleRad * 180) / Math.PI;
}

export function calculateDistance(p1: Point | null, p2: Point | null): number | null {
    if (!p1 || !p2) return null;
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function arePointsAligned(p1: Point, p2: Point, p3: Point, tolerance = 10): boolean {
    const angle = calculateAngle(p1, p2, p3);
    if (angle === null) return false;
    return Math.abs(180 - angle) < tolerance;
}

// --- Yoga Pose Library ---

export interface YogaCheck {
    id: string;
    label: string;
    measure: (kps: Keypoint[]) => number | null;
    ideal: [number, number];
    tip: string;
    tooLow?: string;
    tooHigh?: string;
}

export interface YogaPose {
    id: string;
    name: string;
    emoji: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    checks: YogaCheck[];
}

const KP_MAP: Record<string, number> = {
    nose: 0, left_eye: 1, right_eye: 2, left_ear: 3, right_ear: 4,
    left_shoulder: 5, right_shoulder: 6, left_elbow: 7, right_elbow: 8,
    left_wrist: 9, right_wrist: 10, left_hip: 11, right_hip: 12,
    left_knee: 13, right_knee: 14, left_ankle: 15, right_ankle: 16,
};

export function getKP(keypoints: Keypoint[], name: string, minConf = 0.25): Point | null {
    // Mobile keypoints might be an array or a map. Assuming array based on MoveNet standards.
    const k = keypoints.find(kp => kp.name === name);
    return k && k.score >= minConf ? { x: k.x, y: k.y } : null;
}

export const YOGA_POSES: YogaPose[] = [
    {
        id: 'warrior1',
        name: 'Warrior I',
        emoji: '🥋',
        description: 'Front knee bent 90°, back leg straight, arms raised overhead.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'front_knee',
                label: 'Front Knee',
                measure: (kps) => calculateAngle(getKP(kps, 'left_hip'), getKP(kps, 'left_knee'), getKP(kps, 'left_ankle')),
                ideal: [80, 100],
                tip: 'Bend your front knee to 90°',
                tooLow: ' straightening slightly',
                tooHigh: 'Bend deeper',
            },
            {
                id: 'back_leg',
                label: 'Back Leg',
                measure: (kps) => calculateAngle(getKP(kps, 'right_hip'), getKP(kps, 'right_knee'), getKP(kps, 'right_ankle')),
                ideal: [160, 180],
                tip: 'Straighten your back leg fully',
            }
        ]
    },
    {
        id: 'tree',
        name: 'Tree Pose',
        emoji: '🌳',
        description: 'Stand on one leg, other foot on inner thigh, arms above head.',
        difficulty: 'Beginner',
        checks: [
            {
                id: 'standing_leg',
                label: 'Standing Leg',
                measure: (kps) => calculateAngle(getKP(kps, 'left_hip'), getKP(kps, 'left_knee'), getKP(kps, 'left_ankle')),
                ideal: [165, 180],
                tip: 'Keep your standing leg straight',
            }
        ]
    }
];

// --- Posture Validator ---

export class PostureValidator {
    violations: PostureViolation[] = [];

    validatePosture(keypoints: Keypoint[], exerciseType: string, phase: string = 'mid'): PostureResult {
        this.violations = [];
        const validator = this.getValidator(exerciseType);

        if (validator) {
            validator(keypoints, phase);
        }

        return {
            isValid: this.violations.length === 0,
            feedback: this.generateFeedback(),
            score: this.calculateScore(),
            violations: [...this.violations]
        };
    }

    private getValidator(type: string) {
        const t = type.toLowerCase();
        if (t.includes('squat')) return this.validateSquat.bind(this);
        if (t.includes('pushup')) return this.validatePushup.bind(this);
        if (t.includes('curl')) return this.validateCurl.bind(this);
        return null;
    }

    private validateSquat(kps: Keypoint[], phase: string) {
        const l_sh = getKP(kps, 'left_shoulder');
        const l_hip = getKP(kps, 'left_hip');
        const l_knee = getKP(kps, 'left_knee');

        if (l_sh && l_hip && l_knee) {
            const backAngle = calculateAngle(l_sh, l_hip, l_knee);
            if (backAngle && backAngle < 140) {
                this.violations.push({ type: 'back', severity: 'medium', message: 'Keep your back straighter' });
            }
        }
    }

    private validatePushup(kps: Keypoint[], phase: string) {
        const nose = getKP(kps, 'nose');
        const l_hip = getKP(kps, 'left_hip');
        const l_ank = getKP(kps, 'left_ankle');

        if (nose && l_hip && l_ank) {
            if (!arePointsAligned(nose, l_hip, l_ank, 15)) {
                this.violations.push({ type: 'alignment', severity: 'high', message: 'Keep your body in a straight line' });
            }
        }
    }

    private validateCurl(kps: Keypoint[], phase: string) {
        const l_sh = getKP(kps, 'left_shoulder');
        const l_elb = getKP(kps, 'left_elbow');
        const l_hip = getKP(kps, 'left_hip');

        if (l_sh && l_elb && l_hip) {
            const distElbSh = calculateDistance(l_elb, l_sh);
            const distShHip = calculateDistance(l_sh, l_hip);
            if (distElbSh && distShHip && distElbSh > distShHip * 0.5) {
                this.violations.push({ type: 'elbow', severity: 'medium', message: 'Keep your elbows closer to your body' });
            }
        }
    }

    private generateFeedback(): string {
        if (this.violations.length === 0) return 'Good form!';
        return this.violations.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.severity] - order[b.severity];
        })[0].message;
    }

    private calculateScore(): number {
        if (this.violations.length === 0) return 1.0;
        const penalty = this.violations.reduce((acc, v) => acc + (v.severity === 'high' ? 0.3 : v.severity === 'medium' ? 0.15 : 0.05), 0);
        return Math.max(0, 1.0 - penalty);
    }
}

export function analyzeYogaPose(pose: YogaPose, keypoints: Keypoint[]) {
    let totalScore = 0;
    const checks = pose.checks.map(check => {
        const angle = check.measure(keypoints);
        if (angle === null) return { ...check, angle: null, status: 'unknown', message: 'Cannot see keypoints' };

        const [min, max] = check.ideal;
        const inRange = angle >= min && angle <= max;
        const score = inRange ? 100 : Math.max(0, 100 - Math.abs(angle - (angle < min ? min : max)) * 2);
        totalScore += score;

        return {
            ...check,
            angle: Math.round(angle),
            status: inRange ? 'good' : (score < 60 ? 'bad' : 'warning'),
            message: inRange ? '✓ Great!' : (angle < min ? check.tooLow || check.tip : check.tooHigh || check.tip)
        };
    });

    return {
        score: Math.round(totalScore / pose.checks.length),
        checks
    };
}
