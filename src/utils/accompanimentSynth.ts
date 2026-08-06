// WEBAUDIO SYNTHESIZER FOR AI DRUMS AND BASS REFERENCE ACCOMPANIMENT

export async function generateAccompanimentAudioBlob(opts: {
  bpm: number;
  durationSecs: number;
  keyName: string;
  includeDrums: boolean;
  includeBass: boolean;
  drumPattern: 'rock' | 'pop' | 'funk' | 'reggae';
}): Promise<Blob> {
  const sampleRate = 44100;
  const bpm = Math.max(50, Math.min(220, opts.bpm || 120));
  const totalLength = Math.max(10, Math.min(180, opts.durationSecs || 30));
  const numSamples = Math.floor(sampleRate * totalLength);

  const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

  // Time calculations
  const beatDuration = 60 / bpm; // duration of 1 beat in seconds
  const eighthDuration = beatDuration / 2;
  const sixteenthDuration = beatDuration / 4;

  // Key frequencies (root notes for bass synthesis based on song key)
  const keyFrequencies: Record<string, number[]> = {
    'Do': [65.41, 58.27, 43.65, 49.00], // C2, A1#, F1, G1
    'Re': [73.42, 65.41, 49.00, 55.00], // D2, C2, G1, A1
    'Mi': [82.41, 73.42, 55.00, 61.74], // E2, D2, A1, B1
    'Fa': [87.31, 77.78, 58.27, 65.41], // F2, D#2, A#1, C2
    'Sol': [98.00, 87.31, 65.41, 73.42], // G2, F2, C2, D2
    'La': [55.00, 49.00, 36.71, 41.20], // A1, G1, D1, E1
    'Si': [61.74, 55.00, 41.20, 46.25], // B1, A1, E1, F#1
  };

  const cleanKey = opts.keyName ? opts.keyName.replace(/m|min|Maj|may|#/g, '').trim() : 'La';
  const roots = keyFrequencies[cleanKey] || [55.00, 43.65, 36.71, 41.20];

  // Drums synthesis triggers
  const triggerKick = (time: number) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(time);
    osc.stop(time + 0.13);
  };

  const triggerSnare = (time: number) => {
    const bufferSize = sampleRate * 0.15;
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = offlineCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 800;

    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(offlineCtx.destination);

    const osc = offlineCtx.createOscillator();
    const oscGain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(offlineCtx.destination);

    noise.start(time);
    noise.stop(time + 0.15);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const triggerHiHat = (time: number, isOpen = false) => {
    const bufferSize = sampleRate * (isOpen ? 0.2 : 0.05);
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = offlineCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.25 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.18 : 0.04));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    noise.start(time);
    noise.stop(time + (isOpen ? 0.2 : 0.05));
  };

  const triggerBassNote = (time: number, freq: number, duration: number) => {
    const osc = offlineCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(time);
    osc.stop(time + duration);
  };

  // Schedule beats over totalLength
  let currentTime = 0;
  let barIndex = 0;

  while (currentTime < totalLength - 0.2) {
    const currentRoot = roots[barIndex % roots.length];

    for (let beat = 0; beat < 4; beat++) {
      const beatTime = currentTime + beat * beatDuration;

      if (opts.includeDrums) {
        if (opts.drumPattern === 'reggae') {
          if (beat === 2) {
            triggerKick(beatTime);
            triggerSnare(beatTime);
          }
          triggerHiHat(beatTime + eighthDuration);
        } else if (opts.drumPattern === 'funk') {
          if (beat === 0) triggerKick(beatTime);
          if (beat === 0) triggerKick(beatTime + eighthDuration);
          if (beat === 2) triggerKick(beatTime + eighthDuration);
          if (beat === 1 || beat === 3) triggerSnare(beatTime);
          for (let s = 0; s < 4; s++) {
            triggerHiHat(beatTime + s * sixteenthDuration, s === 2);
          }
        } else {
          // Rock / Pop standard 4/4
          if (beat === 0 || beat === 2) triggerKick(beatTime);
          if (beat === 1 || beat === 3) triggerSnare(beatTime);
          triggerHiHat(beatTime);
          triggerHiHat(beatTime + eighthDuration);
        }
      }

      if (opts.includeBass) {
        if (beat === 0 || beat === 2) {
          triggerBassNote(beatTime, currentRoot, beatDuration * 0.85);
        } else if (beat === 1 || beat === 3) {
          triggerBassNote(beatTime + eighthDuration, currentRoot * 1.0, eighthDuration * 0.8);
        }
      }
    }

    currentTime += 4 * beatDuration;
    barIndex++;
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWavBlob(renderedBuffer);
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
