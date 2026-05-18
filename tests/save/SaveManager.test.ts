// tests/save/SaveManager.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../src/save/SaveManager';

describe('SaveManager', () => {
  let sm: SaveManager;

  beforeEach(() => {
    localStorage.clear();
    sm = new SaveManager();
  });

  it('returns default data when localStorage is empty', () => {
    const data = sm.getData();
    expect(data.stars).toBe(0);
    expect(data.stickers).toEqual([]);
    expect(data.gamesUnlocked).toEqual(['zoo', 'toyStore']);
    expect(data.settings.bgmVolume).toBe(0.5);
    expect(data.settings.sfxVolume).toBe(1.0);
  });

  it('addStars increments stars and persists to localStorage', () => {
    sm.addStars(5);
    expect(sm.getData().stars).toBe(5);
    const restored = new SaveManager();
    expect(restored.getData().stars).toBe(5);
  });

  it('addStars accumulates across multiple calls', () => {
    sm.addStars(3);
    sm.addStars(2);
    expect(sm.getData().stars).toBe(5);
  });

  it('unlockGame adds key to gamesUnlocked', () => {
    sm.unlockGame('farm');
    expect(sm.getData().gamesUnlocked).toContain('farm');
  });

  it('unlockGame does not duplicate keys', () => {
    sm.unlockGame('zoo');
    sm.unlockGame('zoo');
    expect(sm.getData().gamesUnlocked.filter(k => k === 'zoo').length).toBe(1);
  });

  it('updateSettings merges patch without overwriting other keys', () => {
    sm.updateSettings({ bgmVolume: 0.2 });
    expect(sm.getData().settings.bgmVolume).toBe(0.2);
    expect(sm.getData().settings.sfxVolume).toBe(1.0);
  });

  it('restores all data from localStorage on new instance', () => {
    sm.addStars(10);
    sm.unlockGame('farm');
    const restored = new SaveManager();
    expect(restored.getData().stars).toBe(10);
    expect(restored.getData().gamesUnlocked).toContain('farm');
  });

  it('reset clears progress and persists defaults', () => {
    sm.addStars(20);
    sm.reset();
    expect(sm.getData().stars).toBe(0);
    const restored = new SaveManager();
    expect(restored.getData().stars).toBe(0);
  });

  it('addSticker adds key to stickers array', () => {
    sm.addSticker('paintbrush');
    expect(sm.getData().stickers).toContain('paintbrush');
  });

  it('addSticker persists to localStorage', () => {
    sm.addSticker('paintbrush');
    const restored = new SaveManager();
    expect(restored.getData().stickers).toContain('paintbrush');
  });

  it('addSticker does not duplicate keys', () => {
    sm.addSticker('paintbrush');
    sm.addSticker('paintbrush');
    expect(sm.getData().stickers.filter((k: string) => k === 'paintbrush').length).toBe(1);
  });

  it('default save data includes pet state', () => {
    const data = sm.getData();
    expect(data.pet.mascot).toBeNull();
    expect(data.pet.hunger).toBe(80);
    expect(data.pet.energy).toBe(80);
    expect(data.pet.cleanliness).toBe(80);
    expect(data.pet.lastVisit).toBe(0);
  });

  it('pet state persists to localStorage', () => {
    sm.getData().pet.mascot = 'dino';
    sm.getData().pet.hunger = 50;
    sm.save();
    const restored = new SaveManager();
    expect(restored.getData().pet.mascot).toBe('dino');
    expect(restored.getData().pet.hunger).toBe(50);
  });

  it('reset restores default pet state', () => {
    sm.getData().pet.mascot = 'bunny';
    sm.getData().pet.hunger = 30;
    sm.save();
    sm.reset();
    expect(sm.getData().pet.mascot).toBeNull();
    expect(sm.getData().pet.hunger).toBe(80);
  });
});
