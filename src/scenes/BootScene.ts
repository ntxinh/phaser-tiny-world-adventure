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
      // Phase 2 buildings
      { key: 'building_paintHouse',   width: 160, height: 160, color: 0xEC407A, radius: 20 },
      { key: 'building_basketball',   width: 160, height: 160, color: 0xFF7043, radius: 20 },
      // Coloring — lion regions (placeholder shapes)
      { key: 'lion_ears',  width: 160, height: 35,  color: 0xFFCC02, radius: 8  },
      { key: 'lion_face',  width: 100, height: 100, color: 0xFFCC02, radius: 50 },
      { key: 'lion_mane',  width: 160, height: 160, color: 0xFF8F00, radius: 80 },
      { key: 'lion_body',  width: 200, height: 140, color: 0xFFB300, radius: 10 },
      { key: 'lion_tail',  width: 25,  height: 80,  color: 0xFFB300, radius: 6  },
      // Coloring — palette circles
      { key: 'color_red',    width: 90, height: 90, color: 0xE53935, radius: 45 },
      { key: 'color_yellow', width: 90, height: 90, color: 0xFDD835, radius: 45 },
      { key: 'color_orange', width: 90, height: 90, color: 0xFF6D00, radius: 45 },
      { key: 'color_green',  width: 90, height: 90, color: 0x43A047, radius: 45 },
      { key: 'color_blue',   width: 90, height: 90, color: 0x1E88E5, radius: 45 },
      { key: 'color_purple', width: 90, height: 90, color: 0x8E24AA, radius: 45 },
      // Basketball
      { key: 'ball_basketball', width: 80, height: 80, color: 0xFF5722, radius: 40 },
      { key: 'hoop_back',       width: 160, height: 20, color: 0xBF360C, radius: 4 },
      // Stickers
      { key: 'sticker_lion',        width: 100, height: 100, color: 0xFFAA00, radius: 50 },
      { key: 'sticker_star',        width: 100, height: 100, color: 0xFFDD00, radius: 8  },
      { key: 'sticker_paintbrush',  width: 30,  height: 100, color: 0x884400, radius: 6  },
      { key: 'sticker_basketball',  width: 100, height: 100, color: 0xFF6600, radius: 50 },
      // Phase 3 textures
      { key: 'building_musicStage', width: 160, height: 160, color: 0x7E57C2, radius: 20 },
      { key: 'btn_mic',             width: 140, height: 140, color: 0xE91E63, radius: 70 },
      // Phase 4 textures
      { key: 'building_petHouse',   width: 160, height: 160, color: 0xFF8F00, radius: 20 },
      // Paint House UI
      { key: 'btn_save_art',      width: 200, height: 75,  color: 0xEC407A, radius: 22 },
      { key: 'btn_paint_brush',   width: 72,  height: 72,  color: 0x1E88E5, radius: 36 },
      { key: 'btn_paint_eraser',  width: 72,  height: 72,  color: 0x78909C, radius: 36 },
      { key: 'btn_paint_undo',    width: 72,  height: 72,  color: 0xFF8F00, radius: 36 },
      { key: 'btn_paint_redo',    width: 72,  height: 72,  color: 0x43A047, radius: 36 },
      { key: 'paint_bubble',      width: 230, height: 72,  color: 0xFFFDE7, radius: 22 },
      { key: 'svg_thumb',         width: 115, height: 115, color: 0xFFF9C4, radius: 20 },
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
      ['sfx_swish',         'assets/audio/sfx/swish.mp3'],
      ['sfx_bounce_ball',   'assets/audio/sfx/bounce_ball.mp3'],
      ['sfx_tap_color',     'assets/audio/sfx/tap_color.mp3'],
      ['voice_coloring',    'assets/audio/voice/coloring.mp3'],
      ['voice_basketball',  'assets/audio/voice/basketball.mp3'],
      ['sfx_speech_pass',   'assets/audio/sfx/speech_pass.mp3'],
      ['sfx_mic_start',     'assets/audio/sfx/mic_start.mp3'],
      ['bgm_paint',    'assets/audio/bgm/paint.mp3'],
      ['sfx_brush',    'assets/audio/sfx/brush.mp3'],
      ['sfx_save_art', 'assets/audio/sfx/save_art.mp3'],
    ];
    entries.forEach(([key, src]) => AudioManager.register(key, src));
  }
}
