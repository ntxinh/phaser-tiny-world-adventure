import Phaser from 'phaser';

type ScalableGO = Phaser.GameObjects.GameObject & { setScale(v: number): unknown };

export function bounceIn(scene: Phaser.Scene, obj: ScalableGO): void {
  obj.setScale(0);
  scene.tweens.add({
    targets: obj,
    scale: 1.2,
    duration: 200,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({ targets: obj, scale: 1.0, duration: 150, ease: 'Sine.Out' });
    },
  });
}

export function squashStretch(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void {
  scene.tweens.add({
    targets: obj,
    scaleX: 1.3,
    scaleY: 0.7,
    duration: 100,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({ targets: obj, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Back.Out' });
    },
  });
}

export function pulseLoop(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject): void {
  scene.tweens.add({
    targets: obj,
    scale: 1.08,
    duration: 800,
    yoyo: true,
    loop: -1,
    ease: 'Sine.InOut',
  });
}

export function celebrationParticles(scene: Phaser.Scene, x: number, y: number): void {
  const colors = [0xFFD700, 0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFF922B];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const speed = 80 + (i % 5) * 30;
    const dot = scene.add.circle(x, y, 8, colors[i % colors.length]);
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => dot.destroy(),
    });
  }
}

export function screenShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(300, 0.02);
}

export function unlockCelebration(scene: Phaser.Scene): void {
  screenShake(scene);
  const positions = [{ x: 200, y: 200 }, { x: 512, y: 300 }, { x: 820, y: 200 }];
  positions.forEach(({ x, y }, i) => {
    scene.time.delayedCall(i * 200, () => celebrationParticles(scene, x, y));
  });
}
