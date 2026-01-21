/**
 * Rep Counter Engine
 * State-based rep counting with posture validation
 */

import {
    calculateAngle,
    getKeypoint,
    getKeypoints,
    isAngleInRange,
    smoothAngle,
    allKeypointsVisible
} from './poseUtils';
import PostureValidator from './postureValidator';

/**
 * Movement States
 */
const STATES = {
    IDLE: 'idle',
    STARTING: 'starting',
    IN_PROGRESS: 'in_progress',
    COMPLETING: 'completing'
};

/**
 * Rep Counter Engine Class
 */
export class RepCounterEngine {
    constructor(exerciseName) {
        this.exerciseName = exerciseName.toLowerCase();
        this.state = STATES.IDLE;
        this.repCount = 0;
        this.postureValidator = new PostureValidator();

        // State timing (prevent rapid state changes)
        this.stateEnteredAt = Date.now();
        this.minStateHoldTime = 250; // ms - balanced for accuracy and responsiveness

        // Track angle changes to prevent false counts
        this.previousAngle = null;
        this.angleChangeAccumulator = 0;

        // Angle history for smoothing
        this.angleHistory = [];

        // Exercise configuration
        this.config = this.getExerciseConfig();

        // Debug info
        this.debugInfo = {
            currentAngle: 0,
            targetAngle: '',
            postureScore: 1.0,
            postureFeedback: ''
        };
    }

    /**
   * Get exercise-specific configuration
   */
    getExerciseConfig() {
        const configs = {
            squat: {
                keypoints: ['left_hip', 'left_knee', 'left_ankle', 'left_shoulder'],
                angleJoints: ['left_hip', 'left_knee', 'left_ankle'],
                phases: {
                    start: { min: 160, max: 180 },  // Standing
                    mid: { min: 70, max: 110 },      // Bottom of squat
                    end: { min: 160, max: 180 }      // Back to standing
                },
                minAngleChange: 50
            },
            curl: {
                keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
                angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                alternateJoints: ['right_shoulder', 'right_elbow', 'right_wrist'],
                phases: {
                    start: { min: 150, max: 180 },  // Arm extended (relaxed threshold)
                    mid: { min: 30, max: 70 },       // Arm curled (relaxed threshold)
                    end: { min: 150, max: 180 }      // Back to extended
                },
                minAngleChange: 80
            },
            bicep: {
                keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
                angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                alternateJoints: ['right_shoulder', 'right_elbow', 'right_wrist'],
                phases: {
                    start: { min: 150, max: 180 },
                    mid: { min: 30, max: 70 },
                    end: { min: 150, max: 180 }
                },
                minAngleChange: 80
            },
            barbell: {
                keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
                angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                alternateJoints: ['right_shoulder', 'right_elbow', 'right_wrist'],
                phases: {
                    start: { min: 150, max: 180 },
                    mid: { min: 30, max: 70 },
                    end: { min: 150, max: 180 }
                },
                minAngleChange: 80
            },
            pushup: {
                keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                phases: {
                    start: { min: 160, max: 180 },  // Arms extended
                    mid: { min: 70, max: 110 },      // Arms bent
                    end: { min: 160, max: 180 }      // Back to extended
                },
                minAngleChange: 60
            },
            press: {
                keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
                phases: {
                    start: { min: 160, max: 180 },
                    mid: { min: 70, max: 110 },
                    end: { min: 160, max: 180 }
                },
                minAngleChange: 60
            },
            lunge: {
                keypoints: ['left_hip', 'left_knee', 'left_ankle'],
                angleJoints: ['left_hip', 'left_knee', 'left_ankle'],
                phases: {
                    start: { min: 160, max: 180 },  // Standing
                    mid: { min: 70, max: 110 },      // Lunge down
                    end: { min: 160, max: 180 }      // Back up
                },
                minAngleChange: 50
            },
            plank: {
                keypoints: ['left_shoulder', 'left_hip', 'left_ankle'],
                angleJoints: ['left_shoulder', 'left_hip', 'left_ankle'],
                phases: {
                    start: { min: 170, max: 180 },  // Straight body
                    mid: { min: 170, max: 180 },     // Hold
                    end: { min: 170, max: 180 }      // Maintain
                },
                minAngleChange: 0,  // Plank is isometric
                isIsometric: true
            },
            jack: {
                keypoints: ['left_wrist', 'left_shoulder', 'left_hip'],
                angleJoints: ['left_wrist', 'left_shoulder', 'left_hip'],
                phases: {
                    start: { min: 160, max: 180 },  // Arms down
                    mid: { min: 30, max: 90 },       // Arms up
                    end: { min: 160, max: 180 }      // Arms down
                },
                minAngleChange: 70
            },
            burpee: {
                keypoints: ['left_shoulder', 'left_hip', 'left_knee'],
                angleJoints: ['left_shoulder', 'left_hip', 'left_knee'],
                phases: {
                    start: { min: 160, max: 180 },  // Standing
                    mid: { min: 70, max: 110 },      // Down position
                    end: { min: 160, max: 180 }      // Back up
                },
                minAngleChange: 60
            }
        };

        // Find matching config - check for partial matches
        const exerciseLower = this.exerciseName.toLowerCase();
        console.log('🔍 Looking for config for exercise:', exerciseLower);

        for (const [key, config] of Object.entries(configs)) {
            if (exerciseLower.includes(key)) {
                console.log('✅ Found config:', key);
                return config;
            }
        }

        // Default to curl config for any arm exercise
        console.log('⚠️ No specific config found, using default curl config');
        return configs.curl;
    }

    /**
     * Process pose and update rep count
     * @param {Array} keypoints - Pose keypoints
     * @returns {Object} {repCount, state, feedback, debugInfo}
     */
    process(keypoints) {
        if (!keypoints || keypoints.length === 0) {
            return this.getResult('No pose detected');
        }

        // Get required keypoints with lower confidence for better detection
        const kp = getKeypoints(keypoints, this.config.keypoints, 0.25);

        // For curl exercises, we need either left OR right arm visible
        const isCurlExercise = this.config.alternateJoints !== undefined;

        if (isCurlExercise) {
            // Check if we have left arm
            const hasLeftArm = kp['left_shoulder'] && kp['left_elbow'] && kp['left_wrist'];
            // Check if we have right arm
            const hasRightArm = kp['right_shoulder'] && kp['right_elbow'] && kp['right_wrist'];

            if (!hasLeftArm && !hasRightArm) {
                return this.getResult('Show your arms in frame');
            }

            // Use whichever arm is visible (prefer left)
            const jointsToUse = hasLeftArm ? this.config.angleJoints : this.config.alternateJoints;
            const [joint1, joint2, joint3] = jointsToUse;
            const currentAngle = calculateAngle(kp[joint1], kp[joint2], kp[joint3]);

            if (currentAngle === null) {
                return this.getResult('Can\'t calculate arm angle');
            }

            // Smooth the angle
            const { smoothedAngle, newHistory } = smoothAngle(currentAngle, this.angleHistory, 3);
            this.angleHistory = newHistory;
            this.debugInfo.currentAngle = Math.round(smoothedAngle);

            // Process state machine
            const now = Date.now();
            const timeSinceStateChange = now - this.stateEnteredAt;

            if (timeSinceStateChange < this.minStateHoldTime) {
                return this.getResult();
            }

            this.processStateTransition(smoothedAngle, keypoints);
            return this.getResult();
        }

        // For non-curl exercises, check if all required keypoints are visible
        if (!allKeypointsVisible(kp)) {
            return this.getResult('Move into frame - can\'t see all body parts');
        }

        // Calculate primary angle
        const [joint1, joint2, joint3] = this.config.angleJoints;
        const currentAngle = calculateAngle(kp[joint1], kp[joint2], kp[joint3]);

        if (currentAngle === null) {
            return this.getResult('Invalid pose data');
        }

        // Smooth the angle
        const { smoothedAngle, newHistory } = smoothAngle(currentAngle, this.angleHistory, 5);
        this.angleHistory = newHistory;
        this.debugInfo.currentAngle = Math.round(smoothedAngle);

        // State machine logic
        const now = Date.now();
        const timeSinceStateChange = now - this.stateEnteredAt;

        // Prevent rapid state changes
        if (timeSinceStateChange < this.minStateHoldTime) {
            return this.getResult();
        }

        // Process state transitions
        this.processStateTransition(smoothedAngle, keypoints);

        return this.getResult();
    }

    /**
     * Process state transitions based on angle
     */
    processStateTransition(angle, keypoints) {
        const { start, mid, end } = this.config.phases;

        switch (this.state) {
            case STATES.IDLE:
                // Waiting for starting position
                if (isAngleInRange(angle, start.min, start.max)) {
                    this.changeState(STATES.STARTING);
                    this.debugInfo.targetAngle = `${mid.min}-${mid.max}°`;
                }
                break;

            case STATES.STARTING:
                // Validate starting posture
                const startPosture = this.postureValidator.validatePosture(
                    keypoints,
                    this.exerciseName,
                    'start'
                );

                this.debugInfo.postureScore = startPosture.score;
                this.debugInfo.postureFeedback = startPosture.feedback;

                // Move to in-progress if moving toward mid position
                if (!isAngleInRange(angle, start.min, start.max)) {
                    // Just check basic form - relaxed threshold
                    if (startPosture.score > 0.2) {
                        this.changeState(STATES.IN_PROGRESS);
                    } else {
                        this.changeState(STATES.IDLE);
                    }
                }
                break;

            case STATES.IN_PROGRESS:
                // Check if reached mid position
                if (isAngleInRange(angle, mid.min, mid.max)) {
                    // Validate mid posture
                    const midPosture = this.postureValidator.validatePosture(
                        keypoints,
                        this.exerciseName,
                        'mid'
                    );

                    this.debugInfo.postureScore = midPosture.score;
                    this.debugInfo.postureFeedback = midPosture.feedback;

                    // Just check if reached mid position - relaxed threshold
                    if (midPosture.score > 0.2) {
                        this.changeState(STATES.COMPLETING);
                        this.debugInfo.targetAngle = `${end.min}-${end.max}°`;
                    } else {
                        this.changeState(STATES.IDLE);
                    }
                }
                break;

            case STATES.COMPLETING:
                // Check if returned to end position
                if (isAngleInRange(angle, end.min, end.max)) {
                    // Validate end posture
                    const endPosture = this.postureValidator.validatePosture(
                        keypoints,
                        this.exerciseName,
                        'end'
                    );

                    this.debugInfo.postureScore = endPosture.score;
                    this.debugInfo.postureFeedback = endPosture.feedback;

                    // Count if back at start position - relaxed threshold
                    if (endPosture.score > 0.2) {
                        this.repCount++;
                        this.changeState(STATES.IDLE);
                        this.debugInfo.postureFeedback = 'Rep counted!';
                    } else {
                        this.changeState(STATES.IDLE);
                    }
                }
                break;
        }
    }

    /**
     * Change state and record timestamp
     */
    changeState(newState) {
        this.state = newState;
        this.stateEnteredAt = Date.now();
    }

    /**
     * Get current result
     */
    getResult(customFeedback = null) {
        let feedback = customFeedback || this.debugInfo.postureFeedback || this.getStateFeedback();

        return {
            repCount: this.repCount,
            state: this.state,
            feedback,
            debugInfo: { ...this.debugInfo }
        };
    }

    /**
     * Get feedback based on current state
     */
    getStateFeedback() {
        switch (this.state) {
            case STATES.IDLE:
                return 'Get in starting position';
            case STATES.STARTING:
                return 'Good! Now perform the movement';
            case STATES.IN_PROGRESS:
                return 'Keep going...';
            case STATES.COMPLETING:
                return 'Return to start position';
            default:
                return 'Ready';
        }
    }

    /**
     * Reset counter
     */
    reset() {
        this.repCount = 0;
        this.state = STATES.IDLE;
        this.angleHistory = [];
        this.stateEnteredAt = Date.now();
    }

    /**
     * Get current rep count
     */
    getRepCount() {
        return this.repCount;
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
}

export default RepCounterEngine;
