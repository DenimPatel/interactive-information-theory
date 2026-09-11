import { useSyncExternalStore } from 'react';
import { getProgress, subscribeProgress, type ProgressState } from '../utils/progress';

/** Live view of the shared quiz-progress store. */
export const useProgress = (): ProgressState =>
  useSyncExternalStore(subscribeProgress, getProgress, getProgress);
