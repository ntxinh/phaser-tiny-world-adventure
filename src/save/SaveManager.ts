export interface SaveData {
  stars: number;
  stickers: string[];
  gamesUnlocked: string[];
  settings: {
    bgmVolume: number;
    sfxVolume: number;
  };
}

const SAVE_KEY = 'twa_save';

const DEFAULT_SAVE: SaveData = {
  stars: 0,
  stickers: [],
  gamesUnlocked: ['zoo', 'toyStore'],
  settings: { bgmVolume: 0.5, sfxVolume: 1.0 },
};

function cloneDefault(): SaveData {
  return {
    ...DEFAULT_SAVE,
    stickers: [],
    gamesUnlocked: [...DEFAULT_SAVE.gamesUnlocked],
    settings: { ...DEFAULT_SAVE.settings },
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
      return JSON.parse(raw) as SaveData;
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
