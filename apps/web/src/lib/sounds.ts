'use client';

// ─── Procedural Sound Engine ───────────────────────────────────────────────
// All sounds generated via Web Audio API — no files, no downloads.
// Minecraft/voxel chiptune aesthetic.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Master volume (0–1)
let masterVol = 0.4;
export function setMasterVolume(v: number) { masterVol = Math.max(0, Math.min(1, v)); }
export function getMasterVolume() { return masterVol; }

// ─── Primitive helpers ─────────────────────────────────────────────────────

function gain(ac: AudioContext, value: number): GainNode {
  const g = ac.createGain();
  g.gain.value = value * masterVol;
  return g;
}

function osc(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  end: number,
  freqEnd?: number,
): OscillatorNode {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) o.frequency.linearRampToValueAtTime(freqEnd, end);
  o.start(start);
  o.stop(end + 0.01);
  return o;
}

function noise(ac: AudioContext, duration: number, start: number): AudioBufferSourceNode {
  const bufLen = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.start(start);
  src.stop(start + duration);
  return src;
}

function envelope(g: GainNode, ac: AudioContext, start: number, attack: number, sustain: number, decay: number, peak = 1) {
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak * masterVol, start + attack);
  g.gain.setValueAtTime(peak * masterVol, start + attack + sustain);
  g.gain.linearRampToValueAtTime(0, start + attack + sustain + decay);
}

// ─── Sound definitions ─────────────────────────────────────────────────────

/** Soft click — buttons, tabs */
export function playClick() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.001, 0.01, 0.04, 0.25);
  g.connect(ac.destination);
  const o = osc(ac, 'square', 880, t, t + 0.06, 440);
  o.connect(g);
}

/** Hover — subtle tick */
export function playHover() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.001, 0.005, 0.03, 0.08);
  g.connect(ac.destination);
  const o = osc(ac, 'sine', 1200, t, t + 0.04);
  o.connect(g);
}

/** Success / confirm — ascending arpeggio */
export function playSuccess() {
  const ac = getCtx();
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.08;
    const g = ac.createGain();
    envelope(g, ac, t, 0.005, 0.05, 0.12, 0.35);
    g.connect(ac.destination);
    const o = osc(ac, 'square', freq, t, t + 0.18);
    o.connect(g);
  });
}

/** Error / reject — descending buzz */
export function playError() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.005, 0.08, 0.15, 0.3);
  g.connect(ac.destination);
  const o = osc(ac, 'sawtooth', 220, t, t + 0.25, 110);
  o.connect(g);
}

/** Block place — thud + tone */
export function playBlockPlace() {
  const ac = getCtx();
  const t = ac.currentTime;

  // Noise thud
  const ng = ac.createGain();
  envelope(ng, ac, t, 0.001, 0.02, 0.08, 0.4);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  ng.connect(lp);
  lp.connect(ac.destination);
  noise(ac, 0.12, t).connect(ng);

  // Tone
  const og = ac.createGain();
  envelope(og, ac, t, 0.001, 0.01, 0.1, 0.2);
  og.connect(ac.destination);
  osc(ac, 'square', 180, t, t + 0.12, 120).connect(og);
}

/** Block break — crunch */
export function playBlockBreak() {
  const ac = getCtx();
  const t = ac.currentTime;
  const ng = ac.createGain();
  envelope(ng, ac, t, 0.001, 0.03, 0.18, 0.5);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 800;
  ng.connect(hp);
  hp.connect(ac.destination);
  noise(ac, 0.22, t).connect(ng);

  const og = ac.createGain();
  envelope(og, ac, t, 0.001, 0.01, 0.12, 0.15);
  og.connect(ac.destination);
  osc(ac, 'sawtooth', 120, t, t + 0.14, 60).connect(og);
}

/** Footstep — grass crunch */
export function playFootstep() {
  const ac = getCtx();
  const t = ac.currentTime;
  const ng = ac.createGain();
  envelope(ng, ac, t, 0.001, 0.01, 0.06, 0.18);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 600;
  bp.Q.value = 0.8;
  ng.connect(bp);
  bp.connect(ac.destination);
  noise(ac, 0.08, t).connect(ng);
}

/** Jump — boing */
export function playJump() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.001, 0.02, 0.18, 0.3);
  g.connect(ac.destination);
  osc(ac, 'sine', 200, t, t + 0.22, 500).connect(g);
}

/** Land — thump */
export function playLand() {
  const ac = getCtx();
  const t = ac.currentTime;
  const ng = ac.createGain();
  envelope(ng, ac, t, 0.001, 0.01, 0.12, 0.5);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  ng.connect(lp);
  lp.connect(ac.destination);
  noise(ac, 0.15, t).connect(ng);

  const og = ac.createGain();
  envelope(og, ac, t, 0.001, 0.005, 0.1, 0.25);
  og.connect(ac.destination);
  osc(ac, 'sine', 80, t, t + 0.12, 40).connect(og);
}

/** Fly mode engage — whoosh up */
export function playFlyStart() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.01, 0.15, 0.25, 0.35);
  g.connect(ac.destination);
  osc(ac, 'sawtooth', 150, t, t + 0.4, 600).connect(g);

  const ng = ac.createGain();
  envelope(ng, ac, t, 0.01, 0.1, 0.2, 0.15);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1000;
  ng.connect(hp);
  hp.connect(ac.destination);
  noise(ac, 0.4, t).connect(ng);
}

/** Mode switch — blip */
export function playModeSwitch() {
  const ac = getCtx();
  const notes = [440, 660];
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.07;
    const g = ac.createGain();
    envelope(g, ac, t, 0.002, 0.03, 0.08, 0.25);
    g.connect(ac.destination);
    osc(ac, 'square', freq, t, t + 0.12).connect(g);
  });
}

/** Avatar select — pop */
export function playAvatarSelect() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.001, 0.02, 0.1, 0.3);
  g.connect(ac.destination);
  osc(ac, 'sine', 600, t, t + 0.14, 900).connect(g);
}

/** Intro dismiss — magic shimmer */
export function playIntroDismiss() {
  const ac = getCtx();
  const freqs = [523, 659, 784, 1047, 1319, 1568];
  freqs.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.055;
    const g = ac.createGain();
    envelope(g, ac, t, 0.003, 0.04, 0.2, 0.28);
    g.connect(ac.destination);
    osc(ac, 'sine', freq, t, t + 0.28).connect(g);
  });
}

/** Notification / new event — ping */
export function playNotification() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.002, 0.01, 0.25, 0.2);
  g.connect(ac.destination);
  osc(ac, 'sine', 1047, t, t + 0.28, 784).connect(g);
}

/** Agent action — robotic beep */
export function playAgentAction() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.001, 0.02, 0.08, 0.2);
  g.connect(ac.destination);
  osc(ac, 'square', 440, t, t + 0.12).connect(g);

  const g2 = ac.createGain();
  envelope(g2, ac, t + 0.1, 0.001, 0.02, 0.08, 0.15);
  g2.connect(ac.destination);
  osc(ac, 'square', 660, t + 0.1, t + 0.22).connect(g2);
}

/** Command bar open — swoosh */
export function playCommandOpen() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.005, 0.05, 0.15, 0.25);
  g.connect(ac.destination);
  osc(ac, 'sine', 300, t, t + 0.22, 700).connect(g);
}

/** Command bar close */
export function playCommandClose() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.005, 0.05, 0.12, 0.2);
  g.connect(ac.destination);
  osc(ac, 'sine', 700, t, t + 0.18, 300).connect(g);
}

/** Modal open */
export function playModalOpen() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.005, 0.03, 0.12, 0.22);
  g.connect(ac.destination);
  osc(ac, 'sine', 400, t, t + 0.18, 600).connect(g);
}

/** Modal close */
export function playModalClose() {
  const ac = getCtx();
  const t = ac.currentTime;
  const g = ac.createGain();
  envelope(g, ac, t, 0.005, 0.02, 0.1, 0.18);
  g.connect(ac.destination);
  osc(ac, 'sine', 500, t, t + 0.14, 300).connect(g);
}

/** Copy to clipboard — tick tick */
export function playCopy() {
  const ac = getCtx();
  [0, 0.06].forEach((delay) => {
    const t = ac.currentTime + delay;
    const g = ac.createGain();
    envelope(g, ac, t, 0.001, 0.01, 0.05, 0.2);
    g.connect(ac.destination);
    osc(ac, 'square', 1200, t, t + 0.07).connect(g);
  });
}

/** Ambient wind loop (returns stop fn) */
export function startWindAmbient(): () => void {
  const ac = getCtx();
  const ng = ac.createGain();
  ng.gain.value = 0.04 * masterVol;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 100;

  ng.connect(lp);
  lp.connect(hp);
  hp.connect(ac.destination);

  // Looping noise buffer
  const bufLen = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(ng);
  src.start();

  return () => {
    ng.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5);
    setTimeout(() => src.stop(), 600);
  };
}
