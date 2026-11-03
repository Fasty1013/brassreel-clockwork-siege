/**
 * Choreographer — Timeline & Async Event Pacing Engine
 * Decouples deterministic instantaneous engine reducers from paced visual playback.
 * Subscribes to EventBus and coordinates slot spinning, line evaluation, token flights, and combat.
 */
export class Choreographer {
  private queue: (() => Promise<void>)[] = [];
  private isPlaying = false;
  private isSkipping = false;
  private timeMultiplier = 1.0;

  public setTimeMultiplier(mult: number): void {
    this.timeMultiplier = Math.max(0.25, Math.min(4.0, mult));
  }

  public getTimeMultiplier(): number {
    return this.isSkipping ? 4.0 : this.timeMultiplier;
  }

  /**
   * Enqueues an asynchronous action.
   */
  public enqueue(action: () => Promise<void>): this {
    this.queue.push(action);
    if (!this.isPlaying) {
      this.playNext();
    }
    return this;
  }

  /**
   * Helper to enqueue a simple timed delay.
   */
  public wait(durationMs: number): this {
    return this.enqueue(() => {
      return new Promise<void>((resolve) => {
        const effectiveMs = durationMs / this.getTimeMultiplier();
        setTimeout(resolve, effectiveMs);
      });
    });
  }

  /**
   * Skips or fast-forwards current animations.
   */
  public skip(): void {
    this.isSkipping = true;
  }

  /**
   * Clears all queued animations.
   */
  public clear(): void {
    this.queue = [];
    this.isPlaying = false;
    this.isSkipping = false;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.isSkipping = false;
      return;
    }

    this.isPlaying = true;
    const nextAction = this.queue.shift();
    if (nextAction) {
      try {
        await nextAction();
      } catch (err) {
        console.warn('Choreographer step error:', err);
      }
    }

    this.playNext();
  }
}
