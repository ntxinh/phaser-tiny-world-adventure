import { SaveManager, PetState } from '../save/SaveManager';

export type ActivityType = 'feed' | 'wash' | 'sleep' | 'dance' | 'learn';

export class PetStateManager {
  private sm: SaveManager;

  constructor(sm: SaveManager) {
    this.sm = sm;
  }

  getState(): PetState {
    return this.sm.getData().pet;
  }

  applyDecay(): void {
    const state = this.getState();
    if (state.lastVisit === 0) return;
    const hours = (Date.now() - state.lastVisit) / 3_600_000;
    state.hunger = Math.round(Math.max(20, state.hunger - Math.min(hours * 5, 60)));
    state.energy = Math.round(Math.max(20, state.energy - Math.min(hours * 4, 60)));
    state.cleanliness = Math.round(Math.max(20, state.cleanliness - Math.min(hours * 3, 60)));
    this.sm.save();
  }

  applyActivity(type: ActivityType): void {
    const state = this.getState();
    switch (type) {
      case 'feed':
        state.hunger = Math.min(100, state.hunger + 30);
        break;
      case 'wash':
        state.cleanliness = Math.min(100, state.cleanliness + 30);
        break;
      case 'sleep':
        state.energy = Math.min(100, state.energy + 40);
        break;
      case 'dance':
        state.hunger = Math.min(100, state.hunger + 10);
        state.energy = Math.min(100, state.energy + 10);
        state.cleanliness = Math.min(100, state.cleanliness + 10);
        break;
      case 'learn':
        break;
    }
    this.sm.save();
  }

  setMascot(key: PetState['mascot']): void {
    this.getState().mascot = key;
    this.sm.save();
  }

  getMoodText(): string {
    const { hunger, energy, cleanliness } = this.getState();
    if (hunger < 40) return "I'm a little hungry… could we eat?";
    if (energy < 40) return "I'm getting sleepy… maybe naptime?";
    if (cleanliness < 40) return "I could use a little bath 🛁";
    return "I'm so happy! 🌟";
  }

  save(): void {
    this.getState().lastVisit = Date.now();
    this.sm.save();
  }
}
