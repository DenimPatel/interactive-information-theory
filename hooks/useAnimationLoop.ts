import { useCallback, useEffect, useRef, useState } from 'react';

export interface AnimationLoop {
  running: boolean;
  /** Steps per second. */
  speed: number;
  setSpeed: (stepsPerSecond: number) => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  step: () => void;
  reset: () => void;
}

export interface AnimationLoopOptions {
  /**
   * Advance the simulation by `dt` seconds. Mutate state held in refs and
   * mirror a throttled copy into `useState` for rendering; `tick` is kept in a
   * ref, so callers need not memoise it.
   */
  tick: (dt: number) => void;
  onReset?: () => void;
  initialSpeed?: number;
  initialRunning?: boolean;
}

/**
 * rAF engine with a fixed-steps-per-second accumulator. Used by MCMC, EM,
 * K-means, backprop and LDPC decoding. Pauses itself when the tab is hidden.
 */
export const useAnimationLoop = ({
  tick,
  onReset,
  initialSpeed = 10,
  initialRunning = false,
}: AnimationLoopOptions): AnimationLoop => {
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const speedRef = useRef(initialSpeed);
  const [speed, setSpeedState] = useState(initialSpeed);
  const [running, setRunning] = useState(initialRunning);

  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  const loop = useCallback(
    (now: number) => {
      if (lastRef.current === null) lastRef.current = now;
      const elapsed = Math.min((now - lastRef.current) / 1000, 0.25);
      lastRef.current = now;

      const stepDuration = 1 / Math.max(0.001, speedRef.current);
      accumulatorRef.current += elapsed;

      let guard = 0;
      while (accumulatorRef.current >= stepDuration && guard < 200) {
        tickRef.current(stepDuration);
        accumulatorRef.current -= stepDuration;
        guard += 1;
      }
      frameRef.current = requestAnimationFrame(loop);
    },
    [],
  );

  useEffect(() => {
    if (!running) {
      cancel();
      return;
    }
    frameRef.current = requestAnimationFrame(loop);
    return cancel;
  }, [running, loop, cancel]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((value) => !value), []);
  const step = useCallback(() => {
    tickRef.current(1 / Math.max(0.001, speedRef.current));
  }, []);
  const setSpeed = useCallback((stepsPerSecond: number) => {
    speedRef.current = stepsPerSecond;
    setSpeedState(stepsPerSecond);
  }, []);
  const reset = useCallback(() => {
    setRunning(false);
    onReset?.();
  }, [onReset]);

  return { running, speed, setSpeed, start, pause, toggle, step, reset };
};
