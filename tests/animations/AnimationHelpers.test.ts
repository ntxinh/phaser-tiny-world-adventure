import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  bounceIn,
  squashStretch,
  pulseLoop,
  celebrationParticles,
  screenShake,
  unlockCelebration,
} from '../../src/animations/AnimationHelpers';

function makeMockScene() {
  return {
    tweens: { add: vi.fn() },
    time: { delayedCall: vi.fn((_delay: number, fn: () => void) => fn()) },
    add: {
      circle: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    },
    cameras: { main: { shake: vi.fn() } },
  };
}

function makeMockObj() {
  return { setScale: vi.fn().mockReturnThis() };
}

describe('bounceIn', () => {
  it('sets scale to 0 before tweening', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    bounceIn(scene as any, obj as any);
    expect(obj.setScale).toHaveBeenCalledWith(0);
  });

  it('tweens to scale 1.2', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    bounceIn(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ scale: 1.2 }));
  });
});

describe('squashStretch', () => {
  it('calls tweens.add with scaleX: 1.3 and scaleY: 0.7', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    squashStretch(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({ scaleX: 1.3, scaleY: 0.7 }),
    );
  });
});

describe('pulseLoop', () => {
  it('calls tweens.add with loop: -1', () => {
    const scene = makeMockScene();
    const obj = makeMockObj();
    pulseLoop(scene as any, obj as any);
    expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ loop: -1 }));
  });
});

describe('screenShake', () => {
  it('calls cameras.main.shake with intensity 0.02 and duration 300', () => {
    const scene = makeMockScene();
    screenShake(scene as any);
    expect(scene.cameras.main.shake).toHaveBeenCalledWith(300, 0.02);
  });
});

describe('celebrationParticles', () => {
  it('creates 20 circles', () => {
    const scene = makeMockScene();
    celebrationParticles(scene as any, 100, 200);
    expect(scene.add.circle).toHaveBeenCalledTimes(20);
  });

  it('creates tweens for each circle', () => {
    const scene = makeMockScene();
    celebrationParticles(scene as any, 100, 200);
    expect(scene.tweens.add).toHaveBeenCalledTimes(20);
  });
});

describe('unlockCelebration', () => {
  it('calls screenShake', () => {
    const scene = makeMockScene();
    unlockCelebration(scene as any);
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });

  it('schedules 3 particle bursts via time.delayedCall', () => {
    const scene = makeMockScene();
    unlockCelebration(scene as any);
    expect(scene.time.delayedCall).toHaveBeenCalledTimes(3);
  });
});
