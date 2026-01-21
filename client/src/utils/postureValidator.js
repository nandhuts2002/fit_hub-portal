/**
 * Posture Validator
 * Validates body posture and provides corrective feedback
 */

import {
    calculateAngle,
    getKeypoint,
    getKeypoints,
    isAngleInRange,
    arePointsAligned,
    calculateDistance
} from './poseUtils';

/**
 * Posture Validator Class
 */
export class PostureValidator {
    constructor() {
        this.violations = [];
        // Track shoulder positions to detect movement
        this.shoulderHistory = [];
    }

    /**
     * Validate posture for a given exercise and movement phase
     * @param {Array} keypoints - Pose keypoints
     * @param {string} exerciseType - Type of exercise (squat, curl, pushup, etc.)
     * @param {string} phase - Movement phase (start, mid, end)
     * @returns {Object} {isValid, feedback, score, violations}
     */
    validatePosture(keypoints, exerciseType, phase) {
        this.violations = [];

        const validator = this.getValidator(exerciseType);
        if (!validator) {
            return { isValid: true, feedback: '', score: 1.0, violations: [] };
        }

        const result = validator(keypoints, phase);

        return {
            isValid: this.violations.length === 0,
            feedback: this.generateFeedback(),
            score: this.calculatePostureScore(),
            violations: [...this.violations]
        };
    }

    /**
     * Get validator function for exercise type
     */
    getValidator(exerciseType) {
        const validators = {
            squat: this.validateSquatPosture.bind(this),
            curl: this.validateCurlPosture.bind(this),
            bicep: this.validateCurlPosture.bind(this),
            pushup: this.validatePushupPosture.bind(this),
            press: this.validatePushupPosture.bind(this),
            lunge: this.validateLungePosture.bind(this),
            plank: this.validatePlankPosture.bind(this),
            'jumping jack': this.validateJumpingJackPosture.bind(this),
            burpee: this.validateBurpeePosture.bind(this)
        };

        // Find matching validator
        for (const [key, validator] of Object.entries(validators)) {
            if (exerciseType.toLowerCase().includes(key)) {
                return validator;
            }
        }

        return null;
    }

    /**
     * Validate Squat Posture
     */
    validateSquatPosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'left_shoulder', 'right_shoulder',
            'left_hip', 'right_hip',
            'left_knee', 'right_knee',
            'left_ankle', 'right_ankle'
        ], 0.3);

        // Check back straightness (hip-shoulder alignment) - relaxed threshold
        if (kp.left_shoulder && kp.left_hip && kp.left_knee) {
            const backAngle = calculateAngle(kp.left_shoulder, kp.left_hip, kp.left_knee);
            if (backAngle && backAngle < 140) {
                this.violations.push({
                    type: 'back_angle',
                    severity: 'medium',
                    message: 'Keep your back straighter'
                });
            }
        }

        // Check knee alignment (knees shouldn't go past toes)
        if (kp.left_knee && kp.left_ankle && phase === 'mid') {
            if (kp.left_knee.x > kp.left_ankle.x + 30) {
                this.violations.push({
                    type: 'knee_alignment',
                    severity: 'high',
                    message: 'Don\'t let your knees go past your toes'
                });
            }
        }

        // Check squat depth at bottom position
        if (phase === 'mid' && kp.left_hip && kp.left_knee) {
            const hipKneeAngle = calculateAngle(kp.left_shoulder, kp.left_hip, kp.left_knee);
            if (hipKneeAngle && hipKneeAngle > 110) {
                this.violations.push({
                    type: 'depth',
                    severity: 'low',
                    message: 'Lower your body further for full range of motion'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Bicep Curl Posture
     */
    validateCurlPosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'nose',
            'left_shoulder', 'right_shoulder',
            'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist',
            'left_hip', 'right_hip'
        ], 0.3);

        // Track shoulder position to detect movement
        if (kp.left_shoulder && kp.right_shoulder) {
            const avgShoulderY = (kp.left_shoulder.y + kp.right_shoulder.y) / 2;
            this.shoulderHistory.push(avgShoulderY);

            // Keep only last 10 frames
            if (this.shoulderHistory.length > 10) {
                this.shoulderHistory.shift();
            }

            // Check for shoulder movement (head bobbing causes this)
            if (this.shoulderHistory.length >= 5) {
                const recent = this.shoulderHistory.slice(-5);
                const min = Math.min(...recent);
                const max = Math.max(...recent);
                const movement = max - min;

                // If shoulders are moving more than 30 pixels, it's likely head movement
                if (movement > 30) {
                    this.violations.push({
                        type: 'shoulder_stability',
                        severity: 'medium',
                        message: 'Keep your body still'
                    });
                }
            }
        }

        // Check elbow stability (shouldn't move much horizontally)
        if (kp.left_elbow && kp.left_shoulder && kp.left_hip) {
            const elbowShoulderDist = calculateDistance(kp.left_elbow, kp.left_shoulder);
            const shoulderHipDist = calculateDistance(kp.left_shoulder, kp.left_hip);

            // Elbow should stay close to body - relaxed threshold
            if (elbowShoulderDist && shoulderHipDist && elbowShoulderDist > shoulderHipDist * 0.5) {
                this.violations.push({
                    type: 'elbow_position',
                    severity: 'medium',
                    message: 'Keep your elbows closer to your body'
                });
            }
        }

        // Check for shoulder rotation (shoulders should stay level)
        if (kp.left_shoulder && kp.right_shoulder) {
            const shoulderTilt = Math.abs(kp.left_shoulder.y - kp.right_shoulder.y);
            if (shoulderTilt > 20) {
                this.violations.push({
                    type: 'shoulder_tilt',
                    severity: 'medium',
                    message: 'Keep your shoulders level'
                });
            }
        }

        // Check for head movement (nose should stay relatively stable)
        if (kp.nose && kp.left_shoulder && kp.right_shoulder) {
            const avgShoulderY = (kp.left_shoulder.y + kp.right_shoulder.y) / 2;
            const noseToShoulderDist = Math.abs(kp.nose.y - avgShoulderY);

            // Nose should maintain consistent distance from shoulders - relaxed threshold
            if (noseToShoulderDist < 30) {
                this.violations.push({
                    type: 'head_movement',
                    severity: 'medium',
                    message: 'Keep your head up'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Push-up Posture
     */
    validatePushupPosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'nose',
            'left_shoulder', 'right_shoulder',
            'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist',
            'left_hip', 'right_hip',
            'left_ankle', 'right_ankle'
        ], 0.3);

        // Check body alignment (head-hip-ankle should be in line)
        if (kp.nose && kp.left_hip && kp.left_ankle) {
            const bodyAlignment = arePointsAligned(kp.nose, kp.left_hip, kp.left_ankle, 15);
            if (!bodyAlignment) {
                this.violations.push({
                    type: 'body_alignment',
                    severity: 'high',
                    message: 'Keep your body in a straight line - don\'t sag your hips'
                });
            }
        }

        // Check elbow angle at bottom position
        if (phase === 'mid' && kp.left_shoulder && kp.left_elbow && kp.left_wrist) {
            const elbowAngle = calculateAngle(kp.left_shoulder, kp.left_elbow, kp.left_wrist);
            if (elbowAngle && elbowAngle > 110) {
                this.violations.push({
                    type: 'depth',
                    severity: 'low',
                    message: 'Lower your chest closer to the ground'
                });
            }
        }

        // Check hand position (should be shoulder-width)
        if (kp.left_wrist && kp.right_wrist && kp.left_shoulder && kp.right_shoulder) {
            const handDist = calculateDistance(kp.left_wrist, kp.right_wrist);
            const shoulderDist = calculateDistance(kp.left_shoulder, kp.right_shoulder);

            if (handDist && shoulderDist && Math.abs(handDist - shoulderDist) > shoulderDist * 0.3) {
                this.violations.push({
                    type: 'hand_position',
                    severity: 'low',
                    message: 'Adjust hand position to shoulder-width'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Lunge Posture
     */
    validateLungePosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'left_hip', 'right_hip',
            'left_knee', 'right_knee',
            'left_ankle', 'right_ankle'
        ], 0.3);

        // Check front knee angle
        if (phase === 'mid' && kp.left_hip && kp.left_knee && kp.left_ankle) {
            const kneeAngle = calculateAngle(kp.left_hip, kp.left_knee, kp.left_ankle);
            if (kneeAngle && kneeAngle < 70) {
                this.violations.push({
                    type: 'knee_angle',
                    severity: 'medium',
                    message: 'Don\'t let your front knee go past your toes'
                });
            }
        }

        // Check upright torso
        if (kp.left_hip && kp.left_knee) {
            const torsoAngle = Math.abs(kp.left_hip.x - kp.left_knee.x);
            if (torsoAngle > 50) {
                this.violations.push({
                    type: 'torso_lean',
                    severity: 'medium',
                    message: 'Keep your torso upright'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Plank Posture
     */
    validatePlankPosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'nose',
            'left_shoulder', 'right_shoulder',
            'left_hip', 'right_hip',
            'left_ankle', 'right_ankle'
        ], 0.3);

        // Check body alignment
        if (kp.nose && kp.left_hip && kp.left_ankle) {
            const bodyAlignment = arePointsAligned(kp.nose, kp.left_hip, kp.left_ankle, 10);
            if (!bodyAlignment) {
                this.violations.push({
                    type: 'body_alignment',
                    severity: 'high',
                    message: 'Keep your body in a straight line'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Jumping Jack Posture
     */
    validateJumpingJackPosture(keypoints, phase) {
        const kp = getKeypoints(keypoints, [
            'left_wrist', 'right_wrist',
            'left_shoulder', 'right_shoulder',
            'left_ankle', 'right_ankle'
        ], 0.3);

        // Check if hands go above head
        if (phase === 'mid' && kp.left_wrist && kp.left_shoulder) {
            if (kp.left_wrist.y > kp.left_shoulder.y) {
                this.violations.push({
                    type: 'arm_height',
                    severity: 'low',
                    message: 'Raise your arms higher above your head'
                });
            }
        }

        return { validated: true };
    }

    /**
     * Validate Burpee Posture
     */
    validateBurpeePosture(keypoints, phase) {
        // Burpee combines pushup and jump, so use those validators
        if (phase === 'mid') {
            return this.validatePushupPosture(keypoints, phase);
        }
        return { validated: true };
    }

    /**
     * Generate feedback message from violations
     */
    generateFeedback() {
        if (this.violations.length === 0) {
            return 'Good form!';
        }

        // Prioritize by severity
        const sorted = [...this.violations].sort((a, b) => {
            const severityOrder = { high: 0, medium: 1, low: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        // Return the most important feedback
        return sorted[0].message;
    }

    /**
     * Calculate posture quality score (0-1)
     */
    calculatePostureScore() {
        if (this.violations.length === 0) return 1.0;

        const severityPenalty = {
            high: 0.3,
            medium: 0.15,
            low: 0.05
        };

        let penalty = 0;
        this.violations.forEach(v => {
            penalty += severityPenalty[v.severity] || 0.1;
        });

        return Math.max(0, 1.0 - penalty);
    }
}

export default PostureValidator;
