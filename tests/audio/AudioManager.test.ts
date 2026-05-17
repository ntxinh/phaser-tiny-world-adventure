// tests/audio/AudioManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    stop: vi.fn(),
    play: vi.fn(),
    volume: vi.fn(),
    loop: vi.fn(),
  })),
}));

import { AudioManager } from '../../src/audio/AudioManager';

describe('AudioManager', () => {
  let am: AudioManager;

  beforeEach(() => {
    vi.clearAllMocks();
    am = new AudioManager();
  });

  it('bgm default volume is 0.5', () => {
    expect(am.getVolume('bgm')).toBe(0.5);
  });

  it('sfx default volume is 1.0', () => {
    expect(am.getVolume('sfx')).toBe(1.0);
  });

  it('voice default volume is 1.0', () => {
    expect(am.getVolume('voice')).toBe(1.0);
  });

  it('setVolume stores new value', () => {
    am.setVolume('bgm', 0.3);
    expect(am.getVolume('bgm')).toBe(0.3);
  });

  it('setVolume clamps below 0 to 0', () => {
    am.setVolume('sfx', -1);
    expect(am.getVolume('sfx')).toBe(0);
  });

  it('setVolume clamps above 1 to 1', () => {
    am.setVolume('voice', 5);
    expect(am.getVolume('voice')).toBe(1);
  });
});
