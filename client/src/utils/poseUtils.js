/**
 * Pose Utilities for Rep Counter
 * Provides geometry calculations and pose analysis functions
 */

/**
 * Calculate angle between three points (in degrees)
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Vertex point {x, y}
 * @param {Object} point3 - Third point {x, y}
 * @returns {number} Angle in degrees (0-180)
 */
export function calculateAngle(point1, point2, point3) {
    if (!point1 || !point2 || !point3) return null;

    // Calculate vectors
    const vector1 = {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    };

    const vector2 = {
        x: point3.x - point2.x,
        y: point3.y - point2.y
    };

    // Calculate dot product and magnitudes
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) return null;

    // Calculate angle in radians then convert to degrees
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp to [-1, 1]
    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
}

/**
 * Calculate Euclidean distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance in pixels
 */
export function calculateDistance(point1, point2) {
    if (!point1 || !point2) return null;

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
}

/**
 * Get keypoint by name with confidence filtering
 * @param {Array} keypoints - Array of keypoints
 * @param {string} name - Keypoint name
 * @param {number} minConfidence - Minimum confidence score (default 0.5)
 * @returns {Object|null} Keypoint or null if not found/low confidence
 */
export function getKeypoint(keypoints, name, minConfidence = 0.5) {
    if (!keypoints || !Array.isArray(keypoints)) return null;

    const keypoint = keypoints.find(kp => kp.name === name);

    if (!keypoint || keypoint.score < minConfidence) {
        return null;
    }

    return keypoint;
}

/**
 * Get multiple keypoints at once
 * @param {Array} keypoints - Array of keypoints
 * @param {Array} names - Array of keypoint names
 * @param {number} minConfidence - Minimum confidence score
 * @returns {Object} Object with keypoint names as keys
 */
export function getKeypoints(keypoints, names, minConfidence = 0.5) {
    const result = {};
    names.forEach(name => {
        result[name] = getKeypoint(keypoints, name, minConfidence);
    });
    return result;
}

/**
 * Smooth angle values over time using moving average
 * @param {number} currentAngle - Current angle value
 * @param {Array} history - Array of previous angles
 * @param {number} windowSize - Number of frames to average (default 5)
 * @returns {Object} {smoothedAngle, newHistory}
 */
export function smoothAngle(currentAngle, history = [], windowSize = 5) {
    if (currentAngle === null || currentAngle === undefined) {
        return { smoothedAngle: null, newHistory: history };
    }

    const newHistory = [...history, currentAngle];

    // Keep only the last windowSize values
    if (newHistory.length > windowSize) {
        newHistory.shift();
    }

    // Calculate average
    const sum = newHistory.reduce((acc, val) => acc + val, 0);
    const smoothedAngle = sum / newHistory.length;

    return { smoothedAngle, newHistory };
}

/**
 * Check if a point is vertically aligned with another (within tolerance)
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @param {number} tolerance - Tolerance in pixels (default 20)
 * @returns {boolean} True if aligned
 */
export function isVerticallyAligned(point1, point2, tolerance = 20) {
    if (!point1 || !point2) return false;
    return Math.abs(point1.x - point2.x) < tolerance;
}

/**
 * Check if a point is horizontally aligned with another (within tolerance)
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @param {number} tolerance - Tolerance in pixels (default 20)
 * @returns {boolean} True if aligned
 */
export function isHorizontallyAligned(point1, point2, tolerance = 20) {
    if (!point1 || !point2) return false;
    return Math.abs(point1.y - point2.y) < tolerance;
}

/**
 * Calculate the slope/angle of a line between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Angle in degrees from horizontal
 */
export function calculateLineAngle(point1, point2) {
    if (!point1 || !point2) return null;

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
}

/**
 * Check if three points form a straight line (within tolerance)
 * @param {Object} point1 - First point
 * @param {Object} point2 - Middle point
 * @param {Object} point3 - Third point
 * @param {number} tolerance - Angle tolerance in degrees (default 10)
 * @returns {boolean} True if points are aligned
 */
export function arePointsAligned(point1, point2, point3, tolerance = 10) {
    const angle = calculateAngle(point1, point2, point3);
    if (angle === null) return false;

    // Straight line is 180 degrees
    return Math.abs(180 - angle) < tolerance;
}

/**
 * Get average position of multiple points
 * @param {Array} points - Array of points {x, y}
 * @returns {Object|null} Average point {x, y} or null
 */
export function getAveragePoint(points) {
    const validPoints = points.filter(p => p !== null && p !== undefined);

    if (validPoints.length === 0) return null;

    const sum = validPoints.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
    );

    return {
        x: sum.x / validPoints.length,
        y: sum.y / validPoints.length
    };
}

/**
 * Check if angle is within a range
 * @param {number} angle - Angle to check
 * @param {number} min - Minimum angle
 * @param {number} max - Maximum angle
 * @returns {boolean} True if within range
 */
export function isAngleInRange(angle, min, max) {
    if (angle === null || angle === undefined) return false;
    return angle >= min && angle <= max;
}

/**
 * Normalize keypoint coordinates to 0-1 range
 * @param {Object} keypoint - Keypoint with x, y
 * @param {number} width - Video width
 * @param {number} height - Video height
 * @returns {Object} Normalized keypoint
 */
export function normalizeKeypoint(keypoint, width, height) {
    if (!keypoint) return null;

    return {
        ...keypoint,
        x: keypoint.x / width,
        y: keypoint.y / height
    };
}

/**
 * Check if all required keypoints are visible
 * @param {Object} keypointMap - Object with keypoint names as keys
 * @returns {boolean} True if all keypoints are non-null
 */
export function allKeypointsVisible(keypointMap) {
    return Object.values(keypointMap).every(kp => kp !== null);
}
