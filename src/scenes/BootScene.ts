import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';

interface TextureDef {
  key: string;
  width: number;
  height: number;
  color: number;
  radius?: number;
}

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create(): void {
    this.generateTextures();
    this.registerAudio();
    this.scene.start('HomeScene');
  }

  private generateTextures(): void {
    const defs: TextureDef[] = [
      // Buildings
      { key: 'building_zoo',      width: 160, height: 160, color: 0x66BB6A, radius: 20 },
      { key: 'building_toyStore', width: 160, height: 160, color: 0xFFA726, radius: 20 },
      { key: 'building_locked',   width: 160, height: 160, color: 0x90A4AE, radius: 20 },
      // Animals
      { key: 'animal_lion',     width: 120, height: 120, color: 0xFFB300, radius: 16 },
      { key: 'animal_elephant', width: 120, height: 120, color: 0x78909C, radius: 16 },
      { key: 'animal_giraffe',  width: 120, height: 120, color: 0xFDD835, radius: 16 },
      { key: 'animal_monkey',   width: 120, height: 120, color: 0xA1887F, radius: 16 },
      { key: 'animal_tiger',    width: 120, height: 120, color: 0xEF6C00, radius: 16 },
      { key: 'animal_bunny',    width: 120, height: 120, color: 0xF8BBD9, radius: 16 },
      // Matching items
      { key: 'item_banana', width: 100, height: 100, color: 0xFFE135, radius: 12 },
      { key: 'item_lion',   width: 100, height: 100, color: 0xD4A017, radius: 12 },
      { key: 'item_fish',   width: 100, height: 100, color: 0x4FC3F7, radius: 12 },
      // Drop zones
      { key: 'zone_yellowBasket', width: 140, height: 140, color: 0xFFF9C4, radius: 12 },
      { key: 'zone_savanna',      width: 140, height: 140, color: 0xFFF3E0, radius: 12 },
      { key: 'zone_water',        width: 140, height: 140, color: 0xE1F5FE, radius: 12 },
      // UI
      { key: 'btn_back', width: 100, height: 100, color: 0xEF5350, radius: 50 },
    ];

    defs.forEach(({ key, width, height, color, radius = 0 }) => {
      const gfx = this.make.graphics({ x: 0, y: 0 }, false);
      gfx.fillStyle(color);
      radius > 0
        ? gfx.fillRoundedRect(0, 0, width, height, radius)
        : gfx.fillRect(0, 0, width, height);
      gfx.generateTexture(key, width, height);
      gfx.destroy();
    });
  }

  private registerAudio(): void {
    // Place audio files in public/assets/audio/ — Howler fails silently if missing.
    const entries: [string, string][] = [
      ['bgm_home',          'assets/audio/bgm/home.mp3'],
      ['sfx_success',       'assets/audio/sfx/success.mp3'],
      ['sfx_bounce',        'assets/audio/sfx/bounce.mp3'],
      ['sfx_roar',          'assets/audio/sfx/roar.mp3'],
      ['sfx_trumpet',       'assets/audio/sfx/trumpet.mp3'],
      ['sfx_hee',           'assets/audio/sfx/hee.mp3'],
      ['sfx_chatter',       'assets/audio/sfx/chatter.mp3'],
      ['sfx_growl',         'assets/audio/sfx/growl.mp3'],
      ['sfx_squeak',        'assets/audio/sfx/squeak.mp3'],
      ['voice_lion',        'assets/audio/voice/lion.mp3'],
      ['voice_elephant',    'assets/audio/voice/elephant.mp3'],
      ['voice_giraffe',     'assets/audio/voice/giraffe.mp3'],
      ['voice_monkey',      'assets/audio/voice/monkey.mp3'],
      ['voice_tiger',       'assets/audio/voice/tiger.mp3'],
      ['voice_bunny',       'assets/audio/voice/bunny.mp3'],
      ['voice_greatjob',    'assets/audio/voice/greatjob.mp3'],
    ];
    entries.forEach(([key, src]) => AudioManager.register(key, src));
  }
}
