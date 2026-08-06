/**
 * Utility for ultra-low latency & clean audio capture, WebAudio DSP filtering,
 * and background noise/speaker bleed suppression for multitrack recording.
 */

export interface StudioAudioStreamOptions {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  highPassCutoff?: number; // default 80Hz
}

export const getLowLatencyAudioStream = async (options?: StudioAudioStreamOptions): Promise<MediaStream> => {
  // Default to echo cancellation and noise suppression ON for multitrack overdubbing to prevent speaker bleed and room hiss
  const useEchoCancellation = options?.echoCancellation ?? true;
  const useNoiseSuppression = options?.noiseSuppression ?? true;
  const useAutoGain = options?.autoGainControl ?? false;

  try {
    const audioConstraints: any = {
      echoCancellation: useEchoCancellation,
      noiseSuppression: useNoiseSuppression,
      autoGainControl: useAutoGain,
      channelCount: { ideal: 2 },
      sampleRate: { ideal: 48000 }
    };

    return await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    });
  } catch (err) {
    console.warn("Audio constraints rejected, falling back to standard audio stream:", err);
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
};

/**
 * Creates a WebAudio DSP cleaning pipeline for microphone recording streams.
 * Removes low-frequency rumble (highpass at 80Hz), electrical hum (notch filter),
 * and dynamic peaks before sending to MediaRecorder.
 */
export interface CleanPipelineResult {
  cleanStream: MediaStream;
  audioCtx: AudioContext;
  cleanup: () => void;
}

export const createCleanAudioRecordingPipeline = (
  rawStream: MediaStream,
  existingCtx?: AudioContext | null
): CleanPipelineResult => {
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = existingCtx || new AudioCtxClass();

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const sourceNode = audioCtx.createMediaStreamSource(rawStream);

  // 1. High-Pass Filter (cut off low frequency rumble < 80Hz)
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(80, audioCtx.currentTime);
  highpass.Q.setValueAtTime(0.707, audioCtx.currentTime);

  // 2. Notch Filter for 50Hz / 60Hz power hum
  const notch50 = audioCtx.createBiquadFilter();
  notch50.type = 'notch';
  notch50.frequency.setValueAtTime(50, audioCtx.currentTime);
  notch50.Q.setValueAtTime(5.0, audioCtx.currentTime);

  const notch60 = audioCtx.createBiquadFilter();
  notch60.type = 'notch';
  notch60.frequency.setValueAtTime(60, audioCtx.currentTime);
  notch60.Q.setValueAtTime(5.0, audioCtx.currentTime);

  // 3. Dynamics Compressor to prevent clipping & stabilize dynamics
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
  compressor.knee.setValueAtTime(20, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(8, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

  // 4. Output Destination for MediaRecorder
  const destination = audioCtx.createMediaStreamDestination();

  // Connect graph
  sourceNode.connect(highpass);
  highpass.connect(notch50);
  notch50.connect(notch60);
  notch60.connect(compressor);
  compressor.connect(destination);

  const cleanup = () => {
    try {
      sourceNode.disconnect();
      highpass.disconnect();
      notch50.disconnect();
      notch60.disconnect();
      compressor.disconnect();
    } catch (_) {}
  };

  return {
    cleanStream: destination.stream,
    audioCtx,
    cleanup
  };
};

/**
 * Trims initial recording startup latency/buffer lag from an audio Blob.
 * Removes the hardware buffer startup lag (default ~100ms - 120ms) so overdubbed tracks
 * align sample-accurately with the backing tracks.
 */
export const trimAudioBlobLatency = async (audioBlob: Blob, latencyMs: number = 110): Promise<Blob> => {
  if (latencyMs <= 0) return audioBlob;
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    const sampleRate = decodedBuffer.sampleRate;
    const samplesToTrim = Math.min(
      Math.floor((latencyMs / 1000) * sampleRate),
      Math.floor(decodedBuffer.length * 0.4) // Safety: do not trim more than 40% of audio
    );

    if (samplesToTrim <= 0) return audioBlob;

    const trimmedLength = decodedBuffer.length - samplesToTrim;
    const offlineCtx = new OfflineAudioContext(
      decodedBuffer.numberOfChannels,
      trimmedLength,
      sampleRate
    );

    const newBuffer = offlineCtx.createBuffer(
      decodedBuffer.numberOfChannels,
      trimmedLength,
      sampleRate
    );

    for (let channel = 0; channel < decodedBuffer.numberOfChannels; channel++) {
      const srcData = decodedBuffer.getChannelData(channel);
      const destData = newBuffer.getChannelData(channel);
      destData.set(srcData.subarray(samplesToTrim));
    }

    return audioBufferToWavBlob(newBuffer);
  } catch (err) {
    console.warn("Latency trimming failed, returning original blob:", err);
    return audioBlob;
  }
};

/**
 * Offline Audio Buffer signal cleaning pass.
 * Filters out low-frequency noise, normalizes audio in memory, and optionally trims initial latency.
 */
export const cleanAudioBlobOffline = async (audioBlob: Blob, latencyTrimMs: number = 0): Promise<Blob> => {
  try {
    let inputBlob = audioBlob;
    if (latencyTrimMs > 0) {
      inputBlob = await trimAudioBlobLatency(audioBlob, latencyTrimMs);
    }

    const arrayBuffer = await inputBlob.arrayBuffer();
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    const offlineCtx = new OfflineAudioContext(
      decodedBuffer.numberOfChannels,
      decodedBuffer.length,
      decodedBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;

    // Highpass filter @ 85Hz
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 85;

    // Dynamics Compressor
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 6;

    source.connect(hp);
    hp.connect(comp);
    comp.connect(offlineCtx.destination);

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer back to WAV Blob
    return audioBufferToWavBlob(renderedBuffer);
  } catch (err) {
    console.warn("Offline audio cleaning failed, returning original blob:", err);
    return audioBlob;
  }
};

/**
 * Utility to convert an AudioBuffer to a clean WAV Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const headerLength = 44;
  const wavBuffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const getSystemAudioLatencyMs = (audioContext?: AudioContext | null): number => {
  if (!audioContext) return 0;
  const outputLatencySecs = (audioContext as any).outputLatency || 0;
  const baseLatencySecs = (audioContext as any).baseLatency || 0;
  return Math.round((outputLatencySecs + baseLatencySecs) * 1000);
};

/**
 * Automatically detects the exact hardware/recording latency offset (in milliseconds)
 * between a master backing track and a newly recorded audio track.
 * Uses envelope cross-correlation and transient attack detection.
 */
export const autoDetectAudioLatencyOffset = async (
  masterAudioUrl: string,
  recordedBlob: Blob
): Promise<number> => {
  try {
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 1. Fetch & decode Master Audio
    const masterRes = await fetch(masterAudioUrl);
    const masterArrBuffer = await masterRes.arrayBuffer();
    const masterBuf = await tempCtx.decodeAudioData(masterArrBuffer);

    // 2. Decode Recorded Audio
    const recArrBuffer = await recordedBlob.arrayBuffer();
    const recBuf = await tempCtx.decodeAudioData(recArrBuffer);

    tempCtx.close();

    // Downsample energy envelope to 10ms frame windows (100 Hz frame rate)
    const frameMs = 10;
    const sampleRate = masterBuf.sampleRate;
    const samplesPerFrame = Math.floor((sampleRate * frameMs) / 1000);

    const getEnvelope = (buffer: AudioBuffer) => {
      const data = buffer.getChannelData(0);
      const framesCount = Math.floor(data.length / samplesPerFrame);
      const env = new Float32Array(framesCount);
      for (let i = 0; i < framesCount; i++) {
        let sum = 0;
        const start = i * samplesPerFrame;
        for (let j = 0; j < samplesPerFrame; j++) {
          const val = data[start + j];
          sum += val * val;
        }
        env[i] = Math.sqrt(sum / samplesPerFrame);
      }
      return env;
    };

    const masterEnv = getEnvelope(masterBuf);
    const recEnv = getEnvelope(recBuf);

    // Look for cross-correlation peak within 0ms to 600ms lag window
    let maxCorr = -1;
    let bestLagMs = 0;

    const minFrameLag = 0;
    const maxFrameLag = 60; // 600ms max lag
    const compareLen = Math.min(masterEnv.length, recEnv.length - maxFrameLag);

    if (compareLen > 50) {
      for (let lag = minFrameLag; lag <= maxFrameLag; lag++) {
        let corr = 0;
        let normMaster = 0;
        let normRec = 0;
        for (let i = 0; i < compareLen; i++) {
          const m = masterEnv[i + lag];
          const r = recEnv[i];
          corr += m * r;
          normMaster += m * m;
          normRec += r * r;
        }
        const denom = Math.sqrt(normMaster * normRec);
        const normalizedCorr = denom > 0 ? corr / denom : 0;
        if (normalizedCorr > maxCorr) {
          maxCorr = normalizedCorr;
          bestLagMs = lag * frameMs;
        }
      }
    }

    if (maxCorr > 0.25 && bestLagMs > 0) {
      return bestLagMs;
    }

    // Fallback: Check first transient onset (attack > 5% peak)
    let firstMasterOnsetMs = 0;
    for (let i = 0; i < masterEnv.length; i++) {
      if (masterEnv[i] > 0.05) { firstMasterOnsetMs = i * frameMs; break; }
    }
    let firstRecOnsetMs = 0;
    for (let i = 0; i < recEnv.length; i++) {
      if (recEnv[i] > 0.05) { firstRecOnsetMs = i * frameMs; break; }
    }

    const onsetDiff = firstRecOnsetMs - firstMasterOnsetMs;
    if (onsetDiff > 20 && onsetDiff < 800) {
      return onsetDiff;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /Android/i.test(navigator.userAgent);
    return isIOS ? 320 : isMobile ? 240 : 110;

  } catch (err) {
    console.warn("Auto latency detection fallback:", err);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /Android/i.test(navigator.userAgent);
    return isIOS ? 320 : isMobile ? 240 : 110;
  }
};

