import { useSyncExternalStore } from 'react';
import { parseRoute, type Route } from './routes';

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

const getSnapshot = (): string => window.location.hash;
const getServerSnapshot = (): string => '';

/**
 * Subscribes to `hashchange` and parses the current hash into a Route.
 * `useSyncExternalStore` keeps every mounted consumer in lockstep, including
 * the back/forward buttons, without any router dependency.
 */
export const useHashRoute = (): Route =>
  parseRoute(useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot));

/** Imperatively move to a hash path (e.g. `/p/bent-coin`). */
export const navigate = (path: string): void => {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
};
