import React from 'react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';

export interface GlidingIndicatorProps {
  /**
   * Unique layout identifier for Framer Motion shared layout animation.
   * Elements with the same layoutId in the same component subtree will animate between each other.
   */
  layoutId: string;
  /**
   * Additional Tailwind / CSS classes for styling (e.g. background color, border radius, shadow).
   * Default: "inset-0 bg-accent-500 rounded-xl shadow-xs"
   */
  className?: string;
  /**
   * Custom spring transition config. If omitted, uses standard high-performance Apple spring physics.
   */
  transition?: Transition;
  /**
   * Optional inline styles if needed.
   */
  style?: React.CSSProperties;
}

/**
 * Standard spring curve: responsive, natural momentum with zero bounce oscillation.
 */
const DEFAULT_SPRING: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 35,
  mass: 0.8,
};

/**
 * GlidingIndicator
 *
 * Clean, reusable active indicator pill component powered by Framer Motion's shared layout engine.
 * Place inside a relative-positioned button or tab with content wrapped in `relative z-10`.
 * Automatically respects `prefers-reduced-motion` for accessibility.
 */
export const GlidingIndicator: React.FC<GlidingIndicatorProps> = ({
  layoutId,
  className = 'inset-0 bg-accent-500 rounded-xl shadow-xs',
  transition,
  style,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId={layoutId}
      className={`absolute pointer-events-none z-0 ${className}`}
      transition={shouldReduceMotion ? { duration: 0 } : transition || DEFAULT_SPRING}
      initial={false}
      style={style}
      aria-hidden="true"
    />
  );
};

export default GlidingIndicator;
