import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

/**
 * FlyToCartDumbbell
 *
 * Renders a temporary dumbbell icon that flies from a start coordinate to a target (cart) coordinate.
 * The element shrinks and fades out while moving, then removes itself from the DOM when finished.
 *
 * Props:
 * - start: { x: number, y: number }  // viewport coordinates in pixels (e.g., from button center)
 * - end: { x: number, y: number }    // viewport coordinates in pixels (e.g., cart icon center)
 * - duration?: number                 // seconds, default 0.8
 * - size?: number                     // icon size in px, default 28
 * - curveOffset?: number              // how high the arc goes in px, default 120
 * - color?: string                    // icon color, default '#2563eb' (blue-600)
 * - onComplete?: () => void           // callback after animation completes
 */
export default function FlyToCartDumbbell({
  start,
  end,
  duration = 0.9,
  size = 36,
  curveOffset = 120,
  color = '#2563eb',
  onComplete,
}) {
  const [done, setDone] = useState(false);

  // Build a simple bezier-like arc using 3 keyframes
  const { xKF, yKF } = useMemo(() => {
    if (!start || !end) return { xKF: [0, 0, 0], yKF: [0, 0, 0] };
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - Math.abs(curveOffset);
    return {
      xKF: [start.x, midX, end.x],
      yKF: [start.y, midY, end.y],
    };
  }, [start, end, curveOffset]);

  if (!start || !end || done) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[1000]"
      initial={{ x: xKF[0], y: yKF[0], scale: 1, opacity: 1 }}
      animate={{ x: xKF, y: yKF, scale: [1, 0.6, 0.35], opacity: [1, 0.9, 0] }}
      transition={{ duration, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        setDone(true);
        onComplete && onComplete();
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shadow-xl ring-1 ring-blue-200/70"
        style={{ width: size + 12, height: size + 12, backgroundColor: 'white' }}
      >
        <Dumbbell size={size} color={color} className="drop-shadow" />
      </div>
    </motion.div>
  );
}
