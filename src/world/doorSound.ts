import type { DoorState } from "./sequence";

// Sounds of the temporal door, synthesised with Web Audio : no sound file, so
// no licence to track. Off by default (decision of 2026-10-07) : the context
// is only created when the user turns the sound on, which also satisfies the
// browsers' autoplay rules.
//   tick  : short filtered noise, faster as the sequence's tickRate rises
//   souffle : wide noise swell when the leaf starts to open

export class DoorSound {
  private ctx?: AudioContext;
  private noise?: AudioBuffer;
  private nextTick = 0;
  private leafWasOpening = false;
  enabled = false;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      void this.ctx?.suspend();
      return;
    }
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const length = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    void this.ctx.resume();
  }

  /** Called every frame while the sequence plays. */
  update(state: DoorState, playing: boolean) {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !playing) {
      this.leafWasOpening = false;
      return;
    }
    const now = ctx.currentTime;
    if (now >= this.nextTick) {
      this.tick(now);
      this.nextTick = now + 1 / Math.max(1, state.tickRate * 2);
    }
    const opening = state.leaf > 0.01 && state.leaf < 0.99;
    if (opening && !this.leafWasOpening) this.breath(now);
    this.leafWasOpening = opening;
  }

  /** Nothing moves : the next opening starts afresh. */
  idle() {
    this.leafWasOpening = false;
  }

  private burst(start: number, duration: number, filter: BiquadFilterNode, peak: number) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.01, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start, Math.random() * 0.5, duration);
  }

  private tick(start: number) {
    const filter = this.ctx!.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 6;
    this.burst(start, 0.04, filter, 0.5);
  }

  private breath(start: number) {
    const filter = this.ctx!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, start);
    filter.frequency.exponentialRampToValueAtTime(1800, start + 1.1);
    this.burst(start, 1.4, filter, 0.25);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = undefined;
  }
}
