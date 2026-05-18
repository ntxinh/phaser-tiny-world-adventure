export interface PetState {
  mascot: 'dino' | 'bunny' | 'panda' | 'alien' | null;
  hunger: number;
  energy: number;
  cleanliness: number;
  lastVisit: number;
}

export interface SaveData {
  stars: number;
  stickers: string[];
  gamesUnlocked: string[];
  settings: {
    bgmVolume: number;
    sfxVolume: number;
  };
  pet: PetState;
}

const SAVE_KEY = 'twa_save';

const DEFAULT_SAVE: SaveData = {
  stars: 0,
  stickers: [],
  gamesUnlocked: ['zoo', 'toyStore'],
  settings: { bgmVolume: 0.5, sfxVolume: 1.0 },
  pet: { mascot: null, hunger: 80, energy: 80, cleanliness: 80, lastVisit: 0 },
};

function cloneDefault(): SaveData {
  return {
    ...DEFAULT_SAVE,
    stickers: [],
    gamesUnlocked: [...DEFAULT_SAVE.gamesUnlocked],
    settings: { ...DEFAULT_SAVE.settings },
    pet: { ...DEFAULT_SAVE.pet },
  };
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  load(): SaveData {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return cloneDefault();
    try {
      const parsed = JSON.parse(raw) as SaveData;
      if (!parsed.pet) parsed.pet = { ...DEFAULT_SAVE.pet };
      return parsed;
    } catch {
      return cloneDefault();
    }
  }

  save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  getData(): SaveData {
    return this.data;
  }

  addStars(n: number): void {
    this.data.stars += n;
    this.save();
  }

  unlockGame(key: string): void {
    if (!this.data.gamesUnlocked.includes(key)) {
      this.data.gamesUnlocked.push(key);
      this.save();
    }
  }

  addSticker(key: string): void {
    if (!this.data.stickers.includes(key)) {
      this.data.stickers.push(key);
      this.save();
    }
  }

  updateSettings(patch: Partial<SaveData['settings']>): void {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  reset(): void {
    this.data = cloneDefault();
    this.save();
  }
}

export default new SaveManager();
