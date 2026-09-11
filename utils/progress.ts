/**
 * One versioned progress key, shared by the quiz, the sidebar and the course
 * home. All localStorage access is wrapped in try/catch: private-mode Safari
 * throws on read as well as write.
 */
export const PROGRESS_KEY = 'itprnn:progress:v1';

/** slug -> question id -> whether the first answer was correct. */
export type ProgressState = Record<string, Record<string, boolean>>;

/** The full persisted store: answers plus the known question count per page. */
export interface ProgressStore {
  answers: ProgressState;
  totals: Record<string, number>;
}

export interface Completion {
  answered: number;
  correct: number;
  total: number;
}

export const emptyProgress = (): ProgressState => ({});

export const parseProgressStore = (raw: string | null): ProgressStore => {
  if (!raw) return { answers: {}, totals: {} };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'answers' in parsed) {
      const answers = (parsed as { answers?: unknown }).answers;
      const totals = (parsed as { totals?: unknown }).totals;
      return {
        answers: answers && typeof answers === 'object' ? (answers as ProgressState) : {},
        totals: totals && typeof totals === 'object' ? (totals as Record<string, number>) : {},
      };
    }
    return { answers: {}, totals: {} };
  } catch {
    return { answers: {}, totals: {} };
  }
};

export const parseProgress = (raw: string | null): ProgressState => parseProgressStore(raw).answers;

export const serializeProgressStore = (store: ProgressStore): string =>
  JSON.stringify({ v: 1, answers: store.answers, totals: store.totals });

export const serializeProgress = (state: ProgressState): string =>
  serializeProgressStore({ answers: state, totals: {} });

/** Pure update: record one answer without mutating the previous state. */
export const recordAnswer = (
  state: ProgressState,
  slug: string,
  questionId: string,
  correct: boolean,
): ProgressState => ({
  ...state,
  [slug]: { ...(state[slug] ?? {}), [questionId]: correct },
});

/** Counts answered/correct for a page given its question ids. */
export const completionFor = (
  state: ProgressState,
  slug: string,
  questionIds: readonly string[],
): Completion => {
  const answers = state[slug] ?? {};
  const answered = questionIds.filter((id) => id in answers).length;
  const correct = questionIds.filter((id) => answers[id] === true).length;
  return { answered, correct, total: questionIds.length };
};

// ─── Live store ────────────────────────────────────────────────────────────

const read = (): ProgressStore => {
  try {
    if (typeof localStorage === 'undefined') return { answers: {}, totals: {} };
    return parseProgressStore(localStorage.getItem(PROGRESS_KEY));
  } catch {
    return { answers: {}, totals: {} };
  }
};

let current: ProgressStore = read();
const listeners = new Set<() => void>();

const persist = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROGRESS_KEY, serializeProgressStore(current));
    }
  } catch {
    /* private mode — keep the in-memory state only */
  }
};

/** The whole store (answers + question counts). */
export const getProgressStore = (): ProgressStore => current;

/** Just the answers, for consumers that predate the totals rollup. */
export const getProgress = (): ProgressState => current.answers;

export const subscribeProgress = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (): void => listeners.forEach((listener) => listener());

const setStore = (next: ProgressStore): void => {
  current = next;
  persist();
  emit();
};

export const answerQuestion = (slug: string, questionId: string, correct: boolean): void => {
  setStore({ answers: recordAnswer(current.answers, slug, questionId, correct), totals: current.totals });
};

/** Called by a mounted quiz so the rollup knows each page's question count. */
export const registerQuiz = (slug: string, total: number): void => {
  if (current.totals[slug] === total) return;
  setStore({ answers: current.answers, totals: { ...current.totals, [slug]: total } });
};

export const resetProgress = (): void => setStore({ answers: {}, totals: {} });
