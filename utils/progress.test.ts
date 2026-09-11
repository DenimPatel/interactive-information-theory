import { describe, it, expect } from 'vitest';
import {
  emptyProgress,
  parseProgress,
  parseProgressStore,
  serializeProgress,
  serializeProgressStore,
  recordAnswer,
  completionFor,
  registerQuiz,
  getProgressStore,
  resetProgress,
} from './progress';

describe('progress store', () => {
  it('round-trips through its versioned envelope', () => {
    let state = emptyProgress();
    state = recordAnswer(state, 'bent-coin', 'q1', true);
    state = recordAnswer(state, 'bent-coin', 'q2', false);
    expect(parseProgress(serializeProgress(state))).toEqual(state);
  });

  it('ignores malformed or legacy payloads', () => {
    expect(parseProgress(null)).toEqual({});
    expect(parseProgress('not json')).toEqual({});
    expect(parseProgress('{"v":1}')).toEqual({});
  });

  it('records answers without mutating the previous state', () => {
    const before = emptyProgress();
    const after = recordAnswer(before, 'huffman', 'q1', true);
    expect(before).toEqual({});
    expect(after).toEqual({ huffman: { q1: true } });
  });

  it('counts answered and correct separately', () => {
    let state = emptyProgress();
    state = recordAnswer(state, 'bsc', 'q1', true);
    state = recordAnswer(state, 'bsc', 'q2', false);
    expect(completionFor(state, 'bsc', ['q1', 'q2', 'q3'])).toEqual({
      answered: 2,
      correct: 1,
      total: 3,
    });
  });

  it('reports zero for an untouched page', () => {
    expect(completionFor(emptyProgress(), 'nope', ['a'])).toEqual({
      answered: 0,
      correct: 0,
      total: 1,
    });
  });

  it('round-trips question totals through the store envelope', () => {
    const store = { answers: { 'bent-coin': { q1: true } }, totals: { 'bent-coin': 4 } };
    expect(parseProgressStore(serializeProgressStore(store))).toEqual(store);
  });

  it('reads legacy answer-only payloads without totals', () => {
    expect(parseProgressStore('{"v":1,"answers":{"x":{"q1":false}}}')).toEqual({
      answers: { x: { q1: false } },
      totals: {},
    });
  });

  it('registers quiz sizes for the rollup and resets cleanly', () => {
    resetProgress();
    registerQuiz('foo', 4);
    expect(getProgressStore().totals.foo).toBe(4);
    resetProgress();
    expect(getProgressStore()).toEqual({ answers: {}, totals: {} });
  });
});
