import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { AnimalScene } from './scenes/AnimalScene';
import { MatchingScene } from './scenes/MatchingScene';
import { ColoringScene } from './scenes/ColoringScene';
import { BasketballScene } from './scenes/BasketballScene';
import { RewardScene } from './scenes/RewardScene';
import { SpeechScene } from './scenes/SpeechScene';
import { PetScene } from './scenes/PetScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, HomeScene, AnimalScene, MatchingScene, ColoringScene, BasketballScene, RewardScene, SpeechScene, PetScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
