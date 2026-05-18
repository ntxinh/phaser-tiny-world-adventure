import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BackButton } from '../ui/BackButton';
import { SpeechRecognizer } from '../speech/SpeechRecognizer';
import { bounceIn, celebrationParticles, pulseLoop } from '../animations/AnimationHelpers';

type Category = 'animals' | 'fruits' | 'colors' | 'shapes' | 'numbers';

const WORDS: Record<Category, string[]> = {
  animals: ['lion', 'duck', 'fish', 'frog', 'bear', 'cat', 'dog', 'bird'],
  fruits:  ['apple', 'banana', 'mango', 'grape', 'orange', 'pear'],
  colors:  ['red', 'blue', 'green', 'yellow', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'star', 'heart', 'triangle'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six'],
};

const CATEGORY_DEFS: Array<{ key: Category; label: string; color: number }> = [
  { key: 'animals', label: 'Animals', color: 0x66BB6A },
  { key: 'fruits',  label: 'Fruits',  color: 0xFFA726 },
  { key: 'colors',  label: 'Colors',  color: 0xEC407A },
  { key: 'shapes',  label: 'Shapes',  color: 0x42A5F5 },
  { key: 'numbers', label: 'Numbers', color: 0xAB47BC },
];

export class SpeechScene extends Phaser.Scene {
  private recognizer = new SpeechRecognizer();
  private currentCategory: Category = 'animals';
  private remainingWords: string[] = [];
  private currentWord = '';
  private isListening = false;

  private categoryObjects: Phaser.GameObjects.GameObject[] = [];
  private gameObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'SpeechScene' }); }

  create(): void {
    this.isListening = false;
    this.add.rectangle(512, 384, 1024, 768, 0x1A237E);
    this.add.text(512, 55, 'Say It!', {
      fontSize: '52px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#7C4DFF',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.showCategoryPicker();
    this.events.once('shutdown', () => {
      this.recognizer.stopListening();
      this.tweens.killAll();
    });
    new BackButton(this, () => {
      this.recognizer.stopListening();
      this.scene.start('HomeScene');
    });
  }

  private showCategoryPicker(): void {
    this.clearObjects(this.categoryObjects);

    const row1 = CATEGORY_DEFS.slice(0, 3);
    const row2 = CATEGORY_DEFS.slice(3);

    row1.forEach(({ key, label, color }, i) => {
      this.addCategoryButton(key, label, color, 200 + i * 310, 300);
    });
    row2.forEach(({ key, label, color }, i) => {
      this.addCategoryButton(key, label, color, 360 + i * 310, 500);
    });
  }

  private addCategoryButton(key: Category, label: string, color: number, x: number, y: number): void {
    const rect = this.add.rectangle(x, y, 240, 140, color, 1).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '34px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    pulseLoop(this, rect);

    rect.on('pointerup', () => {
      AudioManager.playSfx('sfx_success');
      this.startCategory(key);
    });

    this.categoryObjects.push(rect, text);
  }

  private startCategory(key: Category): void {
    this.currentCategory = key;
    this.remainingWords = [...WORDS[key]];
    Phaser.Utils.Array.Shuffle(this.remainingWords);
    this.clearObjects(this.categoryObjects);
    this.nextWord();
  }

  private nextWord(): void {
    this.clearObjects(this.gameObjects);

    if (this.remainingWords.length === 0) {
      this.remainingWords = [...WORDS[this.currentCategory]];
      Phaser.Utils.Array.Shuffle(this.remainingWords);
    }

    this.currentWord = this.remainingWords.pop()!;
    const catDef = CATEGORY_DEFS.find(c => c.key === this.currentCategory)!;

    // Back to categories button
    const backBtn = this.add.text(110, 110, '← Categories', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => {
      this.recognizer.stopListening();
      this.isListening = false;
      this.showCategoryPicker();
    });

    // Word image placeholder
    const wordRect = this.add.rectangle(512, 300, 220, 220, catDef.color).setStrokeStyle(6, 0xffffff);

    // Word text
    const wordText = this.add.text(512, 450, this.currentWord.toUpperCase(), {
      fontSize: '56px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    bounceIn(this, wordRect);

    if (this.recognizer.isSupported()) {
      this.showMicButton(wordRect, wordText);
    } else {
      this.showSpeakerButton();
    }

    this.gameObjects.push(backBtn, wordRect, wordText);
  }

  private showMicButton(
    wordRect: Phaser.GameObjects.Rectangle,
    wordText: Phaser.GameObjects.Text,
  ): void {
    const micBtn = this.add.image(512, 600, 'btn_mic').setInteractive({ useHandCursor: true });
    const micLabel = this.add.text(512, 600, '🎤', {
      fontSize: '48px',
    }).setOrigin(0.5);
    const statusText = this.add.text(512, 680, 'Tap to speak', {
      fontSize: '28px', color: '#B0BEC5', fontFamily: 'Arial',
    }).setOrigin(0.5);

    pulseLoop(this, micBtn);

    micBtn.on('pointerup', () => {
      if (this.isListening) return;
      this.isListening = true;
      statusText.setText('Listening...').setColor('#69F0AE');
      AudioManager.playSfx('sfx_mic_start');

      this.recognizer.startListening(
        this.currentWord,
        () => {
          this.isListening = false;
          statusText.setText('').setColor('#B0BEC5');
          AudioManager.playSfx('sfx_speech_pass');
          celebrationParticles(this, wordRect.x, wordRect.y);
          bounceIn(this, wordText);
          this.time.delayedCall(800, () => this.nextWord());
        },
        () => {
          this.isListening = false;
          statusText.setText('Try again!').setColor('#FF5252');
          this.time.delayedCall(1200, () => {
            if (statusText.active) statusText.setText('Tap to speak').setColor('#B0BEC5');
          });
        },
      );
    });

    this.gameObjects.push(micBtn, micLabel, statusText);
  }

  private showSpeakerButton(): void {
    const speakerBtn = this.add.rectangle(512, 600, 220, 100, 0x546E7A)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const speakerLabel = this.add.text(512, 600, '🔊 Hear it', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    speakerBtn.on('pointerup', () => {
      const utt = new SpeechSynthesisUtterance(this.currentWord);
      utt.lang = 'en-US';
      utt.rate = 0.8;
      window.speechSynthesis.speak(utt);
    });

    this.gameObjects.push(speakerBtn, speakerLabel);
  }

  private clearObjects(arr: Phaser.GameObjects.GameObject[]): void {
    arr.forEach(o => {
      this.tweens.killTweensOf(o);
      o.destroy();
    });
    arr.length = 0;
  }
}
