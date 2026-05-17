import { Howl } from 'howler';

type Channel = 'bgm' | 'sfx' | 'voice';

interface ChannelState {
  volume: number;
  current: Howl | null;
}

export class AudioManager {
  private sounds = new Map<string, Howl>();
  private channels: Record<Channel, ChannelState> = {
    bgm:   { volume: 0.5, current: null },
    sfx:   { volume: 1.0, current: null },
    voice: { volume: 1.0, current: null },
  };

  register(key: string, src: string | string[]): void {
    if (this.sounds.has(key)) return;
    this.sounds.set(key, new Howl({ src: Array.isArray(src) ? src : [src] }));
  }

  playBgm(key: string): void {
    const howl = this.sounds.get(key);
    if (!howl) return;
    this.channels.bgm.current?.stop();
    howl.volume(this.channels.bgm.volume);
    howl.loop(true);
    howl.play();
    this.channels.bgm.current = howl;
  }

  playSfx(key: string): void {
    const howl = this.sounds.get(key);
    if (!howl) return;
    howl.volume(this.channels.sfx.volume);
    howl.play();
    this.channels.sfx.current = howl;
  }

  playVoice(key: string): void {
    const howl = this.sounds.get(key);
    if (!howl) return;
    this.channels.voice.current?.stop();
    howl.volume(this.channels.voice.volume);
    howl.play();
    this.channels.voice.current = howl;
  }

  setVolume(channel: Channel, value: number): void {
    this.channels[channel].volume = Math.max(0, Math.min(1, value));
    this.channels[channel].current?.volume(this.channels[channel].volume);
  }

  getVolume(channel: Channel): number {
    return this.channels[channel].volume;
  }

  stopBgm(): void {
    this.channels.bgm.current?.stop();
    this.channels.bgm.current = null;
  }
}

export default new AudioManager();
