import { MotionZone, MotionSensitivity } from '../types';

export class BrowserMotionDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private width = 64;
  private height = 48;
  private isMotionActive = false;
  private lastMotionTime = 0;
  private motionStartTime = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  public detect(
    video: HTMLVideoElement,
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM',
    zones: MotionZone[],
    cooldownMs = 4000,
    minDurationMs = 300
  ): {
    hasMotion: boolean;
    motionRatio: number;
    triggeredZone?: MotionZone;
    motionJustStarted: boolean;
    motionJustStopped: boolean;
  } {
    if (!this.ctx || video.readyState < 2 || video.videoWidth === 0) {
      return { hasMotion: false, motionRatio: 0, motionJustStarted: false, motionJustStopped: false };
    }

    this.ctx.drawImage(video, 0, 0, this.width, this.height);
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    let threshold = 25;
    let minDeltaRatio = 0.035;

    switch (sensitivity) {
      case 'LOW':
        threshold = 40;
        minDeltaRatio = 0.08;
        break;
      case 'MEDIUM':
        threshold = 25;
        minDeltaRatio = 0.035;
        break;
      case 'HIGH':
        threshold = 15;
        minDeltaRatio = 0.015;
        break;
      case 'CUSTOM':
        threshold = 20;
        minDeltaRatio = 0.025;
        break;
    }

    let diffCount = 0;
    let triggeredZone: MotionZone | undefined;
    const activeZones = zones.filter((z) => z.isEnabled);

    if (this.prevFrameData && this.prevFrameData.length === data.length) {
      for (let i = 0; i < data.length; i += 4) {
        // Compute perceptual luminance
        const currLuma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const prevLuma =
          0.299 * this.prevFrameData[i] +
          0.587 * this.prevFrameData[i + 1] +
          0.114 * this.prevFrameData[i + 2];

        if (Math.abs(currLuma - prevLuma) > threshold) {
          const pixelIndex = i / 4;
          const px = (pixelIndex % this.width) / this.width;
          const py = Math.floor(pixelIndex / this.width) / this.height;

          if (activeZones.length > 0) {
            const matched = activeZones.find(
              (z) =>
                px * 100 >= z.xPercent &&
                px * 100 <= z.xPercent + z.widthPercent &&
                py * 100 >= z.yPercent &&
                py * 100 <= z.yPercent + z.heightPercent
            );
            if (matched) {
              diffCount++;
              if (!triggeredZone) triggeredZone = matched;
            }
          } else {
            diffCount++;
          }
        }
      }
    }

    // Save current frame for next comparison
    this.prevFrameData = new Uint8ClampedArray(data);

    const totalPixels = this.width * this.height;
    const motionRatio = diffCount / totalPixels;
    const now = Date.now();

    let motionJustStarted = false;
    let motionJustStopped = false;

    if (motionRatio >= minDeltaRatio) {
      if (!this.isMotionActive) {
        if (this.motionStartTime === 0) {
          this.motionStartTime = now;
        } else if (now - this.motionStartTime >= minDurationMs) {
          this.isMotionActive = true;
          motionJustStarted = true;
          this.lastMotionTime = now;
        }
      } else {
        this.lastMotionTime = now;
      }
    } else {
      this.motionStartTime = 0;
      if (this.isMotionActive && now - this.lastMotionTime > cooldownMs) {
        this.isMotionActive = false;
        motionJustStopped = true;
      }
    }

    return {
      hasMotion: this.isMotionActive || motionRatio >= minDeltaRatio,
      motionRatio,
      triggeredZone,
      motionJustStarted,
      motionJustStopped,
    };
  }

  public captureSnapshot(video: HTMLVideoElement, addTimestamp = true): string {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

    if (addTimestamp) {
      const now = new Date();
      const timeStr = `SECURECAM | ${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${String(
        now.getMilliseconds()
      ).padStart(3, '0')}`;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(16, snapCanvas.height - 48, 480, 36);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(timeStr, 28, snapCanvas.height - 24);
    }

    return snapCanvas.toDataURL('image/jpeg', 0.85);
  }
}
