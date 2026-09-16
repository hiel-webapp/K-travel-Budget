"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Ease-Out Quart Easing Function
 * Starts fast and decelerates smoothly toward the target value.
 */
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export function useCountUp(targetValue: number, durationMs = 1100): number {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const startTimestampRef = useRef<number | null>(null);
  const startValRef = useRef<number>(0);
  const targetRef = useRef<number>(targetValue);

  useEffect(() => {
    startValRef.current = currentValue;
    targetRef.current = targetValue;
    startTimestampRef.current = null;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) {
        startTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - startTimestampRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutQuart(progress);

      const nextVal = Math.round(
        startValRef.current + (targetRef.current - startValRef.current) * easedProgress
      );

      setCurrentValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs]);

  return currentValue;
}
