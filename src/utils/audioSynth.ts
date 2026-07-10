/**
 * Web Audio API Ambient Sound Synthesizer
 * Synthesizes organic, seamless, procedural ambient audio streams completely client-side.
 */

class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private nodes: { [key: string]: { gain: GainNode; source?: AudioNode; lfo?: any } } = {};
  private active: boolean = false;

  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createWhiteNoiseBuffer(): AudioBuffer {
    const size = 2 * this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, size, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createPinkNoiseBuffer(): AudioBuffer {
    const size = 2 * this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, size, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // estimate
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createBrownNoiseBuffer(): AudioBuffer {
    const size = 2 * this.ctx!.sampleRate;
    const buffer = this.ctx!.createBuffer(1, size, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // volume compensation
    }
    return buffer;
  }

  public setVolume(sound: string, volume: number) {
    this.initCtx();
    if (!this.active && volume > 0) {
      this.startAll();
    }

    const key = sound;
    if (this.nodes[key]) {
      // Smooth volume transition to prevent audio popping
      this.nodes[key].gain.gain.linearRampToValueAtTime(volume, this.ctx!.currentTime + 0.1);
    }
  }

  private startAll() {
    this.active = true;
    this.initCtx();

    // Prevent duplicating nodes if already initialized
    if (Object.keys(this.nodes).length > 0) {
      return;
    }

    // 1. Rain Synthesizer (Pink Noise + Lowpass + Crackle triggers)
    this.setupRain();

    // 2. Cafe Chat (Brown noise rumble + high murmurs + occasional bell/clinks)
    this.setupCafe();

    // 3. White Noise (Pure White Noise buffer)
    this.setupWhiteNoise();

    // 4. Fire (Pink Noise low rumbling + periodic pop crackle impulses)
    this.setupFire();

    // 5. Wind (White noise + High-Q Biquad filter + sweep LFO)
    this.setupWind();
  }

  private setupWhiteNoise() {
    const buffer = this.createWhiteNoiseBuffer();
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx!.destination);

    source.start(0);
    this.nodes["whiteNoise"] = { gain, source };
  }

  private setupRain() {
    const buffer = this.createPinkNoiseBuffer();
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Rain is pink noise with lowpass filter around 600Hz
    const lpFilter = this.ctx!.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 650;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;

    // Add high frequency crackle raindrops (ScriptProcessor or simple oscillator triggers)
    // To make it highly compatible, we generate rain sweeps
    source.connect(lpFilter);
    lpFilter.connect(gain);
    gain.connect(this.ctx!.destination);

    source.start(0);
    this.nodes["rain"] = { gain, source };
  }

  private setupCafe() {
    const buffer = this.createBrownNoiseBuffer();
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Cafe crowd is cozy brown noise + low band pass filter
    const bpFilter = this.ctx!.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.frequency.value = 350;
    bpFilter.Q.value = 1.0;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;

    source.connect(bpFilter);
    bpFilter.connect(gain);
    gain.connect(this.ctx!.destination);

    source.start(0);

    // Periodic organic cafe clinks (synthesized coffee cups!)
    const triggerClink = () => {
      if (!this.active || gain.gain.value < 0.02) {
        setTimeout(triggerClink, 3000 + Math.random() * 8000);
        return;
      }

      try {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();
        osc.type = "sine";
        // Bell frequencies
        osc.frequency.setValueAtTime(1200 + Math.random() * 1500, this.ctx!.currentTime);
        
        oscGain.gain.setValueAtTime(0, this.ctx!.currentTime);
        // Very quick transient pop
        oscGain.gain.linearRampToValueAtTime(gain.gain.value * 0.12, this.ctx!.currentTime + 0.01);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 0.4);

        osc.connect(oscGain);
        oscGain.connect(this.ctx!.destination);

        osc.start();
        osc.stop(this.ctx!.currentTime + 0.5);
      } catch (e) {
        // Safe check
      }

      setTimeout(triggerClink, 4000 + Math.random() * 10000);
    };

    triggerClink();
    this.nodes["cafe"] = { gain, source };
  }

  private setupFire() {
    const buffer = this.createPinkNoiseBuffer();
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Fire roar is pink noise filtered low (rumble)
    const lpFilter = this.ctx!.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 180;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;

    source.connect(lpFilter);
    lpFilter.connect(gain);
    gain.connect(this.ctx!.destination);
    source.start(0);

    // Periodic wood crackle triggers
    const triggerCrackle = () => {
      if (!this.active || gain.gain.value < 0.02) {
        setTimeout(triggerCrackle, 500 + Math.random() * 3000);
        return;
      }

      try {
        // High frequency filtered impulses
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(80 + Math.random() * 100, this.ctx!.currentTime);

        const hpFilter = this.ctx!.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.value = 2000;

        oscGain.gain.setValueAtTime(0, this.ctx!.currentTime);
        oscGain.gain.linearRampToValueAtTime(gain.gain.value * 0.6, this.ctx!.currentTime + 0.002);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 0.05);

        osc.connect(hpFilter);
        hpFilter.connect(oscGain);
        oscGain.connect(this.ctx!.destination);

        osc.start();
        osc.stop(this.ctx!.currentTime + 0.1);
      } catch (e) {
        // Safe check
      }

      setTimeout(triggerCrackle, 200 + Math.random() * 1800);
    };

    triggerCrackle();
    this.nodes["fire"] = { gain, source };
  }

  private setupWind() {
    const buffer = this.createWhiteNoiseBuffer();
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Wind uses a sweeping bandpass filter with high Q
    const bpFilter = this.ctx!.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.frequency.value = 400;
    bpFilter.Q.value = 6.0;

    const gain = this.ctx!.createGain();
    gain.gain.value = 0;

    source.connect(bpFilter);
    bpFilter.connect(gain);
    gain.connect(this.ctx!.destination);
    source.start(0);

    // LFO to sweep the wind howling frequencies
    const lfo = this.ctx!.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05; // Sweep frequency: 20 seconds loop

    const lfoGain = this.ctx!.createGain();
    lfoGain.gain.value = 250; // Sweep range in Hz (+/- 250Hz)

    lfo.connect(lfoGain);
    lfoGain.connect(bpFilter.frequency); // Modulate filter frequency!

    lfo.start(0);
    this.nodes["wind"] = { gain, source, lfo };
  }

  public stopAll() {
    this.active = false;
    for (const key of Object.keys(this.nodes)) {
      try {
        this.nodes[key].gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      } catch (e) {
        // Safe check
      }
    }
  }
}

export const ambientSynth = new AmbientSynthesizer();
