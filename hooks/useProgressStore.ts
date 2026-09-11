import { useSyncExternalStore } from 'react';
import {
  getProgressStore,
  subscribeProgress,
  type ProgressStore,
} from '../utils/progress';

/** Live view of the shared quiz-progress store, including question totals. */
export const useProgressStore = (): ProgressStore =>
  useSyncExternalStore(subscribeProgress, getProgressStore, getProgressStore);
