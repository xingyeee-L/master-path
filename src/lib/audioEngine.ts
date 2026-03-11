export type SfxName =
  | 'ui_click'
  | 'cast_open'
  | 'cast_confirm'
  | 'card_nav'
  | 'task_complete'
  | 'achievement'
  | 'level_up'
  | 'zen_enter'
  | 'zen_complete';

type AudioConfig = {
  enabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function now(ctx: AudioContext) {
  return ctx.currentTime;
}

function createNoiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.85;
  }
  return buffer;
}

const TRACKS = [
  {
    url: new URL('../assets/Nintendo Sound Team - 500 p.m. (Sunny)_副本.mp3', import.meta.url).href,
    title: 'ACNH — 500 PM (Sunny)',
  },
  {
    url: new URL('../assets/Nintendo Sound Team - Welcome Horizons_副本.mp3', import.meta.url).href,
    title: 'ACNH — Welcome Horizons',
  },
  {
    url: new URL('../assets/Nintendo Sound Team - 200 a.m. (Sunny)_副本.mp3', import.meta.url).href,
    title: 'ACNH — 200 AM (Sunny)',
  },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private config: AudioConfig = {
    enabled: true,
    bgmEnabled: true,
    sfxEnabled: true,
    bgmVolume: 0.35,
    sfxVolume: 0.6,
  };

  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private bgmPlaying = false;
  private noiseBuffer: AudioBuffer | null = null;
  private unlockBound = false;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmSourceGain: GainNode | null = null;
  private bgmBuffers: AudioBuffer[] = [];
  private bgmTrackIndex = 0;
  private bgmNextTimer: number | null = null;
  private crossfadeSec = 3.0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private paused = false;
  private pauseOffset = 0;
  private trackStartTime = 0;
  private currentBuffer: AudioBuffer | null = null;
  private bgmUrls: string[] = TRACKS.map(t => t.url);
  private bgmTitles: string[] = TRACKS.map(t => t.title);
  private randomMode = true;
  private trackListeners = new Set<(index: number, title: string) => void>();

  configure(next: Partial<AudioConfig>) {
    this.config = {
      ...this.config,
      ...next,
      bgmVolume: clamp01(next.bgmVolume ?? this.config.bgmVolume),
      sfxVolume: clamp01(next.sfxVolume ?? this.config.sfxVolume),
    };
    this.applyVolumes();
    if (!this.config.enabled) this.stopBgm();
    if (this.config.enabled && this.config.bgmEnabled) this.ensureBgm();
  }

  async unlock() {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }
  }

  async ensureBgm() {
    if (!this.config.enabled || !this.config.bgmEnabled) return;
    await this.unlock();
    if (this.paused) {
      this.resumeBgm();
    } else {
      this.startBgm();
    }
  }

  playSfx(name: SfxName) {
    if (!this.config.enabled || !this.config.sfxEnabled) return;
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    if (!this.sfxGain) return;
    if (ctx.state !== 'running') return;

    switch (name) {
      case 'ui_click':
        this.sfxClick(ctx);
        break;
      case 'cast_open':
        this.sfxSoftRise(ctx);
        break;
      case 'cast_confirm':
        this.sfxCast(ctx);
        break;
      case 'card_nav':
        this.sfxTick(ctx);
        break;
      case 'task_complete':
        this.sfxComplete(ctx);
        break;
      case 'achievement':
        this.sfxAchievement(ctx);
        break;
      case 'level_up':
        this.sfxLevelUp(ctx);
        break;
      case 'zen_enter':
        this.sfxZenEnter(ctx);
        break;
      case 'zen_complete':
        this.sfxZenComplete(ctx);
        break;
    }
  }

  private getOrCreateContext() {
    if (typeof window === 'undefined') return null;
    const AnyWindow = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = AnyWindow.AudioContext ?? AnyWindow.webkitAudioContext;
    if (!Ctx) return null;

    if (!this.ctx) {
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.noiseBuffer = createNoiseBuffer(this.ctx, 1.5);
      this.applyVolumes(true);
    }
    return this.ctx;
  }
 
  attachUnlockListeners() {
    if (this.unlockBound) return;
    this.unlockBound = true;
    if (typeof window === 'undefined') return;
    const resume = async () => {
      await this.unlock();
      await this.ensureBgm();
    };
    const once = () => {
      window.removeEventListener('pointerdown', handle);
      window.removeEventListener('keydown', handle);
      window.removeEventListener('touchstart', handle, { passive: true } as EventListenerOptions);
    };
    const handle = () => {
      resume().finally(once);
    };
    window.addEventListener('pointerdown', handle, { passive: true } as EventListenerOptions);
    window.addEventListener('keydown', handle, { passive: true } as EventListenerOptions);
    window.addEventListener('touchstart', handle, { passive: true } as EventListenerOptions);
  }

  private applyVolumes(immediate = false) {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain) return;
    const enabled = this.config.enabled ? 1 : 0;
    const t = this.ctx ? now(this.ctx) : 0;
    const ramp = immediate ? 0 : 0.06;
    this.masterGain.gain.cancelScheduledValues(t);
    this.bgmGain.gain.cancelScheduledValues(t);
    this.sfxGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(enabled, t + ramp);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
    this.bgmGain.gain.linearRampToValueAtTime((this.config.bgmEnabled ? this.config.bgmVolume : 0), t + ramp);
    this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, t);
    this.sfxGain.gain.linearRampToValueAtTime((this.config.sfxEnabled ? this.config.sfxVolume : 0), t + ramp);
  }

  private async loadBgmBuffers(ctx: AudioContext) {
    if (this.bgmBuffers.length > 0) return;
    const buffers: AudioBuffer[] = [];
    for (const url of this.bgmUrls) {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      buffers.push(buf);
    }
    this.bgmBuffers = buffers;
  }

  private async startBgm() {
    if (this.bgmPlaying) return;
    const ctx = this.getOrCreateContext();
    if (!ctx || !this.bgmGain || ctx.state !== 'running') return;
    await this.loadBgmBuffers(ctx);

    const out = this.bgmGain;

    const source = ctx.createBufferSource();
    const sourceGain = ctx.createGain();
    const buf = this.bgmBuffers[this.bgmTrackIndex % this.bgmBuffers.length];
    source.buffer = buf;
    source.loop = false;
    source.connect(sourceGain);
    sourceGain.connect(out);

    const t0 = now(ctx);
    const fade = 1.2;
    out.gain.setValueAtTime(out.gain.value, t0);
    out.gain.linearRampToValueAtTime(this.config.bgmEnabled ? this.config.bgmVolume : 0, t0 + fade);
    sourceGain.gain.setValueAtTime(0.0001, t0);
    sourceGain.gain.linearRampToValueAtTime(1.0, t0 + fade);

    source.start();
    this.bgmSource = source;
    this.bgmSourceGain = sourceGain;
    this.bgmPlaying = true;
    this.activeSources.add(source);
    this.pauseOffset = 0;
    this.trackStartTime = now(ctx);
    this.currentBuffer = buf;
    this.scheduleNext(buf.duration - this.pauseOffset);
    this.notifyTrackChange();
  }
 
  private nextRandomIndex() {
    if (this.bgmBuffers.length <= 1) return this.bgmTrackIndex;
    let idx = this.bgmTrackIndex;
    while (idx === this.bgmTrackIndex) {
      idx = Math.floor(Math.random() * this.bgmBuffers.length);
    }
    return idx;
  }
 
  private scheduleNext(duration: number) {
    if (!this.ctx) return;
    if (this.bgmNextTimer) {
      window.clearTimeout(this.bgmNextTimer);
      this.bgmNextTimer = null;
    }
    const ms = Math.max(0, (duration - this.crossfadeSec) * 1000);
    this.bgmNextTimer = window.setTimeout(() => this.crossfadeToNext(), ms);
  }
 
  private crossfadeToNext() {
    const len = this.bgmBuffers.length;
    if (len === 0) return;
    const nextIdx = this.randomMode ? this.nextRandomIndex() : (this.bgmTrackIndex + 1) % len;
    this.crossfadeToIndex(nextIdx);
  }
 
  private crossfadeToIndex(index: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGain || !this.bgmSource || !this.bgmSourceGain || !this.bgmBuffers.length) return;
    const bounded = ((index % this.bgmBuffers.length) + this.bgmBuffers.length) % this.bgmBuffers.length;
    this.bgmTrackIndex = bounded;
    const nextBuf = this.bgmBuffers[bounded];
    const nextSource = ctx.createBufferSource();
    const nextGain = ctx.createGain();
    nextSource.buffer = nextBuf;
    nextSource.loop = false;
    nextSource.connect(nextGain);
    nextGain.connect(this.bgmGain);
    const t = now(ctx);
    nextGain.gain.setValueAtTime(0.0001, t);
    nextGain.gain.linearRampToValueAtTime(1.0, t + this.crossfadeSec);
    this.bgmSourceGain.gain.cancelScheduledValues(t);
    this.bgmSourceGain.gain.setValueAtTime(this.bgmSourceGain.gain.value, t);
    this.bgmSourceGain.gain.linearRampToValueAtTime(0.0, t + this.crossfadeSec);
    nextSource.start(t);
    const stopOthers = () => {
      for (const s of Array.from(this.activeSources)) {
        if (s === nextSource) continue;
        try {
          s.stop();
        } catch { void 0 }
        try {
          s.disconnect();
        } catch { void 0 }
        this.activeSources.delete(s);
      }
    };
    window.setTimeout(stopOthers, Math.max(50, Math.floor(this.crossfadeSec * 1000)));
    this.bgmSource = nextSource;
    this.bgmSourceGain = nextGain;
    this.activeSources.add(nextSource);
    this.paused = false;
    this.pauseOffset = 0;
    this.trackStartTime = now(ctx);
    this.currentBuffer = nextBuf;
    this.scheduleNext(nextBuf.duration - this.pauseOffset);
    this.notifyTrackChange();
  }

  stopBgm() {
    if (!this.bgmPlaying) return;
    const ctx = this.ctx;
    this.bgmPlaying = false;
    if (!ctx) return;
    const t = now(ctx);
    if (this.bgmGain) {
      this.bgmGain.gain.cancelScheduledValues(t);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
      this.bgmGain.gain.linearRampToValueAtTime(0, t + 0.25);
    }
    if (this.bgmSource) {
      try {
        this.bgmSource.stop(t + 0.28);
      } catch { void 0 }
      try {
        this.bgmSource.disconnect();
      } catch { void 0 }
    }
    for (const s of Array.from(this.activeSources)) {
      try {
        s.stop();
      } catch { void 0 }
      try {
        s.disconnect();
      } catch { void 0 }
      this.activeSources.delete(s);
    }
    if (this.bgmNextTimer) {
      window.clearTimeout(this.bgmNextTimer);
      this.bgmNextTimer = null;
    }
    this.bgmSource = null;
    this.bgmSourceGain = null;
    this.paused = false;
    this.pauseOffset = 0;
    this.currentBuffer = null;
    this.trackStartTime = 0;
  }
 
  getPlaylist() {
    return {
      tracks: this.bgmUrls.map((url, i) => ({ url, title: this.bgmTitles[i] ?? url })),
      currentIndex: this.bgmTrackIndex,
      random: this.randomMode,
    };
  }
 
  setRandomMode(v: boolean) {
    this.randomMode = !!v;
  }
 
  subscribeTrackChange(handler: (index: number, title: string) => void) {
    this.trackListeners.add(handler);
    return () => {
      this.trackListeners.delete(handler);
    };
  }
 
  private notifyTrackChange() {
    const title = this.bgmTitles[this.bgmTrackIndex] ?? '';
    for (const fn of this.trackListeners) fn(this.bgmTrackIndex, title);
  }
 
  async addTrackFile(file: File) {
    const url = URL.createObjectURL(file);
    this.bgmUrls.push(url);
    this.bgmTitles.push(file.name);
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const arr = await file.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    this.bgmBuffers.push(buf);
    this.notifyTrackChange();
  }
 
  nextTrack() {
    const len = this.bgmBuffers.length;
    if (len === 0) return;
    const idx = this.randomMode ? this.nextRandomIndex() : (this.bgmTrackIndex + 1) % len;
    this.crossfadeToIndex(idx);
  }
 
  prevTrack() {
    const len = this.bgmBuffers.length;
    if (len === 0) return;
    const idx = (this.bgmTrackIndex - 1 + len) % len;
    this.crossfadeToIndex(idx);
  }
 
  playIndex(i: number) {
    if (!Number.isFinite(i)) return;
    this.crossfadeToIndex(i);
  }
 
  pauseBgm() {
    const ctx = this.ctx;
    if (!ctx || !this.bgmSource || !this.bgmSourceGain) return;
    this.paused = true;
    const t = now(ctx);
    this.bgmSourceGain.gain.cancelScheduledValues(t);
    this.bgmSourceGain.gain.setValueAtTime(this.bgmSourceGain.gain.value, t);
    this.bgmSourceGain.gain.linearRampToValueAtTime(0.0, t + 0.2);
    const stopAll = () => {
      for (const s of Array.from(this.activeSources)) {
        try { s.stop(); } catch { void 0 }
        try { s.disconnect(); } catch { void 0 }
        this.activeSources.delete(s);
      }
    };
    window.setTimeout(stopAll, 220);
    const elapsed = t - this.trackStartTime;
    this.pauseOffset += Math.max(0, elapsed);
    if (this.bgmNextTimer) {
      window.clearTimeout(this.bgmNextTimer);
      this.bgmNextTimer = null;
    }
    this.bgmSource = null;
    this.bgmSourceGain = null;
    this.bgmPlaying = false;
  }
 
  resumeBgm() {
    const ctx = this.getOrCreateContext();
    if (!ctx || !this.bgmGain || !this.currentBuffer) return;
    const out = this.bgmGain;
    const source = ctx.createBufferSource();
    const sourceGain = ctx.createGain();
    source.buffer = this.currentBuffer;
    source.loop = false;
    source.connect(sourceGain);
    sourceGain.connect(out);
    const t0 = now(ctx);
    sourceGain.gain.setValueAtTime(0.0001, t0);
    sourceGain.gain.linearRampToValueAtTime(1.0, t0 + 0.3);
    source.start(t0, this.pauseOffset);
    this.bgmSource = source;
    this.bgmSourceGain = sourceGain;
    this.activeSources.add(source);
    this.trackStartTime = t0;
    this.bgmPlaying = true;
    this.paused = false;
    const remaining = Math.max(0.01, this.currentBuffer.duration - this.pauseOffset);
    this.scheduleNext(remaining);
  }
 
  isPaused() {
    return this.paused;
  }
 
  isPlaying() {
    return !!this.bgmSource;
  }

  private sfxEnvelope(gain: GainNode, start: number, attack: number, decay: number, peak: number, end: number) {
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(end, start + attack + decay);
  }

  private sfxTick(ctx: AudioContext) {
    const t0 = now(ctx);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, t0);
    osc.frequency.exponentialRampToValueAtTime(560, t0 + 0.06);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.004, 0.08, 0.12, 0.0001);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 400;
    osc.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  }

  private sfxClick(ctx: AudioContext) {
    const t0 = now(ctx);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, t0);
    osc.frequency.exponentialRampToValueAtTime(420, t0 + 0.05);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.003, 0.06, 0.10, 0.0001);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.10);
  }

  private sfxSoftRise(ctx: AudioContext) {
    const t0 = now(ctx);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.20);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.02, 0.24, 0.08, 0.0001);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(800, t0);
    f.frequency.exponentialRampToValueAtTime(1800, t0 + 0.25);
    osc.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.30);
  }

  private sfxCast(ctx: AudioContext) {
    const t0 = now(ctx);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.08);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.004, 0.12, 0.18, 0.0001);

    const whoosh = ctx.createBufferSource();
    whoosh.buffer = this.noiseBuffer;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.setValueAtTime(600, t0);
    wf.frequency.exponentialRampToValueAtTime(1400, t0 + 0.14);
    wf.Q.value = 0.9;
    const wg = ctx.createGain();
    this.sfxEnvelope(wg, t0, 0.01, 0.18, 0.10, 0.0001);

    whoosh.connect(wf);
    wf.connect(wg);
    wg.connect(this.sfxGain!);

    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.20);
    whoosh.start(t0);
    whoosh.stop(t0 + 0.22);
  }

  private sfxComplete(ctx: AudioContext) {
    const t0 = now(ctx);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sine';
    o2.type = 'triangle';
    o1.frequency.setValueAtTime(523.25, t0);
    o2.frequency.setValueAtTime(659.25, t0);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.004, 0.22, 0.22, 0.0001);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2200, t0);
    f.frequency.exponentialRampToValueAtTime(900, t0 + 0.22);
    o1.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    o1.start(t0);
    o2.start(t0);
    o1.stop(t0 + 0.26);
    o2.stop(t0 + 0.26);
  }

  private sfxAchievement(ctx: AudioContext) {
    const t0 = now(ctx);
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.01, 0.6, 0.12, 0.0001);
    o.frequency.setValueAtTime(880, t0);
    o.frequency.exponentialRampToValueAtTime(1320, t0 + 0.20);
    o.frequency.exponentialRampToValueAtTime(660, t0 + 0.60);
    const d = ctx.createDelay();
    d.delayTime.value = 0.18;
    const fb = ctx.createGain();
    fb.gain.value = 0.25;
    d.connect(fb);
    fb.connect(d);
    o.connect(g);
    g.connect(this.sfxGain!);
    g.connect(d);
    d.connect(this.sfxGain!);
    o.start(t0);
    o.stop(t0 + 0.75);
  }

  private sfxLevelUp(ctx: AudioContext) {
    const t0 = now(ctx);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.01, 1.0, 0.14, 0.0001);
    o.frequency.setValueAtTime(220, t0);
    o.frequency.exponentialRampToValueAtTime(880, t0 + 0.32);
    o.frequency.exponentialRampToValueAtTime(440, t0 + 0.95);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, t0);
    f.frequency.exponentialRampToValueAtTime(700, t0 + 1.0);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    o.start(t0);
    o.stop(t0 + 1.1);
  }

  private sfxZenEnter(ctx: AudioContext) {
    const t0 = now(ctx);
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.02, 0.5, 0.08, 0.0001);
    o.frequency.setValueAtTime(220, t0);
    o.frequency.exponentialRampToValueAtTime(196, t0 + 0.45);
    o.connect(g);
    g.connect(this.sfxGain!);
    o.start(t0);
    o.stop(t0 + 0.55);
  }

  private sfxZenComplete(ctx: AudioContext) {
    const t0 = now(ctx);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(196, t0);
    o2.frequency.setValueAtTime(392, t0);
    const g = ctx.createGain();
    this.sfxEnvelope(g, t0, 0.02, 0.9, 0.10, 0.0001);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1400, t0);
    f.frequency.exponentialRampToValueAtTime(600, t0 + 0.9);
    o1.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(this.sfxGain!);
    o1.start(t0);
    o2.start(t0);
    o1.stop(t0 + 1.0);
    o2.stop(t0 + 1.0);
  }
}

export const audioEngine = new AudioEngine();
