import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../src/save/SaveManager';
import { PetStateManager } from '../../src/pet/PetStateManager';

describe('PetStateManager', () => {
  let sm: SaveManager;
  let mgr: PetStateManager;

  beforeEach(() => {
    localStorage.clear();
    sm = new SaveManager();
    mgr = new PetStateManager(sm);
  });

  it('getState returns default pet state', () => {
    const state = mgr.getState();
    expect(state.mascot).toBeNull();
    expect(state.hunger).toBe(80);
    expect(state.energy).toBe(80);
    expect(state.cleanliness).toBe(80);
    expect(state.lastVisit).toBe(0);
  });

  describe('applyDecay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does nothing when lastVisit is 0', () => {
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(80);
      expect(mgr.getState().energy).toBe(80);
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('reduces hunger, energy, cleanliness by elapsed hours', () => {
      // 12 hours ago: hunger loses min(12*5,60)=60→20, energy loses min(12*4,60)=48→32, clean loses min(12*3,60)=36→44
      sm.getData().pet.lastVisit = new Date('2026-01-01T00:00:00.000Z').getTime();
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(20);
      expect(mgr.getState().energy).toBe(32);
      expect(mgr.getState().cleanliness).toBe(44);
    });

    it('floors all values at 20 regardless of elapsed time', () => {
      // 48 hours: all lose min(48*rate, 60) = 60 → all = max(20, 80-60) = 20
      sm.getData().pet.lastVisit = new Date('2025-12-30T12:00:00.000Z').getTime();
      mgr.applyDecay();
      expect(mgr.getState().hunger).toBe(20);
      expect(mgr.getState().energy).toBe(20);
      expect(mgr.getState().cleanliness).toBe(20);
    });

    it('persists decayed values to localStorage', () => {
      sm.getData().pet.lastVisit = new Date('2026-01-01T00:00:00.000Z').getTime();
      mgr.applyDecay();
      const restored = new SaveManager();
      expect(restored.getData().pet.hunger).toBe(20);
    });
  });

  describe('applyActivity', () => {
    it('feed adds 30 to hunger', () => {
      sm.getData().pet.hunger = 50;
      mgr.applyActivity('feed');
      expect(mgr.getState().hunger).toBe(80);
    });

    it('feed caps hunger at 100', () => {
      sm.getData().pet.hunger = 90;
      mgr.applyActivity('feed');
      expect(mgr.getState().hunger).toBe(100);
    });

    it('wash adds 30 to cleanliness', () => {
      sm.getData().pet.cleanliness = 50;
      mgr.applyActivity('wash');
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('wash caps cleanliness at 100', () => {
      sm.getData().pet.cleanliness = 80;
      mgr.applyActivity('wash');
      expect(mgr.getState().cleanliness).toBe(100);
    });

    it('sleep adds 40 to energy', () => {
      sm.getData().pet.energy = 50;
      mgr.applyActivity('sleep');
      expect(mgr.getState().energy).toBe(90);
    });

    it('sleep caps energy at 100', () => {
      sm.getData().pet.energy = 70;
      mgr.applyActivity('sleep');
      expect(mgr.getState().energy).toBe(100);
    });

    it('dance adds 10 to all three needs', () => {
      sm.getData().pet.hunger = 60;
      sm.getData().pet.energy = 60;
      sm.getData().pet.cleanliness = 60;
      mgr.applyActivity('dance');
      expect(mgr.getState().hunger).toBe(70);
      expect(mgr.getState().energy).toBe(70);
      expect(mgr.getState().cleanliness).toBe(70);
    });

    it('dance caps all values at 100', () => {
      sm.getData().pet.hunger = 95;
      sm.getData().pet.energy = 95;
      sm.getData().pet.cleanliness = 95;
      mgr.applyActivity('dance');
      expect(mgr.getState().hunger).toBe(100);
      expect(mgr.getState().energy).toBe(100);
      expect(mgr.getState().cleanliness).toBe(100);
    });

    it('learn does not change any need values', () => {
      mgr.applyActivity('learn');
      expect(mgr.getState().hunger).toBe(80);
      expect(mgr.getState().energy).toBe(80);
      expect(mgr.getState().cleanliness).toBe(80);
    });

    it('activity persists to localStorage', () => {
      sm.getData().pet.hunger = 50;
      mgr.applyActivity('feed');
      const restored = new SaveManager();
      expect(restored.getData().pet.hunger).toBe(80);
    });
  });

  describe('setMascot', () => {
    it('saves mascot choice', () => {
      mgr.setMascot('dino');
      expect(mgr.getState().mascot).toBe('dino');
    });

    it('allows changing mascot', () => {
      mgr.setMascot('dino');
      mgr.setMascot('panda');
      expect(mgr.getState().mascot).toBe('panda');
    });

    it('persists mascot to localStorage', () => {
      mgr.setMascot('bunny');
      const restored = new SaveManager();
      expect(restored.getData().pet.mascot).toBe('bunny');
    });
  });

  describe('getMoodText', () => {
    it('returns happy text when all needs >= 60', () => {
      expect(mgr.getMoodText()).toBe("I'm so happy! 🌟");
    });

    it('prioritises hunger message over energy when both low', () => {
      sm.getData().pet.hunger = 30;
      sm.getData().pet.energy = 30;
      expect(mgr.getMoodText()).toBe("I'm a little hungry… could we eat?");
    });

    it('returns energy message when energy < 40 and hunger >= 40', () => {
      sm.getData().pet.energy = 30;
      expect(mgr.getMoodText()).toBe("I'm getting sleepy… maybe naptime?");
    });

    it('returns cleanliness message when cleanliness < 40 and others >= 40', () => {
      sm.getData().pet.cleanliness = 30;
      expect(mgr.getMoodText()).toBe("I could use a little bath 🛁");
    });
  });

  describe('save', () => {
    it('updates lastVisit to current time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'));
      mgr.save();
      expect(mgr.getState().lastVisit).toBe(new Date('2026-06-01T10:00:00.000Z').getTime());
      vi.useRealTimers();
    });

    it('persists lastVisit to localStorage', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'));
      mgr.save();
      const restored = new SaveManager();
      expect(restored.getData().pet.lastVisit).toBe(new Date('2026-06-01T10:00:00.000Z').getTime());
      vi.useRealTimers();
    });
  });
});
