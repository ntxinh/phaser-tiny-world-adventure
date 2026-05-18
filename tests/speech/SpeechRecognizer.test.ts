import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeechRecognizer, matchesTarget } from '../../src/speech/SpeechRecognizer';

describe('SpeechRecognizer.isSupported', () => {
  let sr: SpeechRecognizer;

  beforeEach(() => {
    sr = new SpeechRecognizer();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('returns false when no SpeechRecognition API', () => {
    expect(sr.isSupported()).toBe(false);
  });

  it('returns true when window.SpeechRecognition exists', () => {
    (window as any).SpeechRecognition = vi.fn();
    expect(sr.isSupported()).toBe(true);
  });

  it('returns true when window.webkitSpeechRecognition exists', () => {
    (window as any).webkitSpeechRecognition = vi.fn();
    expect(sr.isSupported()).toBe(true);
  });

  it('startListening calls onFail immediately when not supported', () => {
    const onPass = vi.fn();
    const onFail = vi.fn();
    sr.startListening('apple', onPass, onFail);
    expect(onFail).toHaveBeenCalledOnce();
    expect(onPass).not.toHaveBeenCalled();
  });
});

describe('matchesTarget', () => {
  it('returns true when transcript includes target and confidence >= 0.4', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.8 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('returns false when confidence below threshold', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.3 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });

  it('returns false when transcript does not include target', () => {
    const mockResult = [
      { transcript: 'banana', confidence: 0.9 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });

  it('is case-insensitive', () => {
    const mockResult = [
      { transcript: 'APPLE', confidence: 0.7 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('matches when any alternative passes', () => {
    const mockResult = [
      { transcript: 'banana', confidence: 0.9 },
      { transcript: 'apple', confidence: 0.5 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(true);
  });

  it('returns false when all alternatives fail confidence', () => {
    const mockResult = [
      { transcript: 'apple', confidence: 0.1 },
      { transcript: 'apple', confidence: 0.2 },
    ] as unknown as SpeechRecognitionResult;
    expect(matchesTarget(mockResult, 'apple', 0.4)).toBe(false);
  });
});
