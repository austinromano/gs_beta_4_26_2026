// Client-side time-stretching using WSOLA (Waveform Similarity Overlap-Add).
//
// WSOLA keeps pitch intact while changing length. For each output frame it
// searches a small range of input positions for the one whose waveform best
// matches the tail of the previously emitted output, then overlap-adds that
// Hann-windowed frame into the output buffer. The similarity search is what
// makes WSOLA preserve phase continuity — which is how Ableton's "Beats"
// mode keeps kicks from smearing compared to a phase vocoder.
//
// Quality is good on drums and loops, acceptable on melodic content, and
// runs entirely on the main thread in <10ms per second of audio. When we
// move to Rubber Band WASM for Phase 3, the function signature here stays
// the same and the audio store's call sites don't change.

const FRAME_SIZE = 4096;      // ~93ms at 44.1 kHz — long enough for pitch, short enough for transients
const SYNTH_HOP = 1024;       // 75% overlap (4× per frame). Good quality/speed balance.
const SEARCH_RANGE = 512;     // ±~11ms search window for phase alignment

/** Hann window table — built lazily and reused. */
let hannCache: Float32Array | null = null;
function hann(size: number): Float32Array {
  if (hannCache && hannCache.length === size) return hannCache;
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  hannCache = w;
  return w;
}

/**
 * Time-stretch an AudioBuffer by a factor. `factor > 1` slows down (output is
 * longer). `factor < 1` speeds up. Pitch is preserved. Returns a new buffer
 * at the same sample rate and channel count.
 */
export function timeStretch(
  input: AudioBuffer,
  factor: number,
  audioContext: AudioContext,
): AudioBuffer {
  if (factor <= 0) throw new Error('stretch factor must be positive');
  // Bypass when ratio is within 0.5% of 1 — avoids the WSOLA smearing that
  // would cost us perfect-pitch passthrough.
  if (Math.abs(factor - 1) < 0.005) return input;

  const sampleRate = input.sampleRate;
  const channels = input.numberOfChannels;
  const inputLen = input.length;
  const outputLen = Math.max(FRAME_SIZE, Math.floor(inputLen * factor) + FRAME_SIZE);

  const frame = FRAME_SIZE;
  const synthHop = SYNTH_HOP;
  const analysisHop = synthHop / factor;
  const searchRange = SEARCH_RANGE;
  const win = hann(frame);

  const output = audioContext.createBuffer(channels, outputLen, sampleRate);

  // Search uses the TAIL of the last-written output to find the most
  // coherent next input position.
  const tailLen = searchRange;

  for (let ch = 0; ch < channels; ch++) {
    const inData = input.getChannelData(ch);
    const outData = output.getChannelData(ch);

    let outPos = 0;
    let analysisPos = 0;          // fractional — ideal input position
    const prevTail = new Float32Array(tailLen);
    let hasPrev = false;

    while (outPos + frame < outputLen) {
      const center = Math.floor(analysisPos);
      let inStart = center;

      if (hasPrev) {
        // Search [-searchRange/2, +searchRange/2] around center for the
        // input offset whose leading samples best correlate with prevTail.
        const half = searchRange >> 1;
        const lo = Math.max(0, center - half);
        const hi = Math.min(inputLen - frame - tailLen, center + half);
        let bestScore = -Infinity;
        let bestOff = center;
        // Step by 2 for speed. A finer step adds quality but doubles the
        // search cost — 2 is the sweet spot in practice.
        for (let off = lo; off <= hi; off += 2) {
          let score = 0;
          for (let i = 0; i < tailLen; i++) score += prevTail[i] * inData[off + i];
          if (score > bestScore) { bestScore = score; bestOff = off; }
        }
        inStart = bestOff;
      }

      // Bail if we ran out of input.
      if (inStart + frame >= inputLen) break;

      // Overlap-add the windowed frame.
      for (let i = 0; i < frame; i++) outData[outPos + i] += inData[inStart + i] * win[i];

      // Capture the tail for next iteration — sampled `synthHop` into the
      // frame because that's where the next write will overlap.
      if (inStart + synthHop + tailLen < inputLen) {
        for (let i = 0; i < tailLen; i++) prevTail[i] = inData[inStart + synthHop + i] * win[synthHop + i];
        hasPrev = true;
      } else {
        hasPrev = false;
      }

      outPos += synthHop;
      analysisPos += analysisHop;
    }

    // Normalise overlap-add gain. With a Hann window + 75% overlap, the
    // nominal sum is 1.5× — compensate so peak levels stay roughly intact.
    const norm = 1 / 1.5;
    for (let i = 0; i < outputLen; i++) outData[i] *= norm;

    // Safety hard limiter: if peak exceeds 1 after normalisation (can happen
    // at transient boundaries in the search), scale down uniformly.
    let peak = 0;
    for (let i = 0; i < outputLen; i++) if (Math.abs(outData[i]) > peak) peak = Math.abs(outData[i]);
    if (peak > 0.98) {
      const scale = 0.98 / peak;
      for (let i = 0; i < outputLen; i++) outData[i] *= scale;
    }
  }

  // Trim the output buffer to the expected length so we don't leave trailing
  // silence or tail noise.
  const trimmedLen = Math.floor(inputLen * factor);
  const trimmed = audioContext.createBuffer(channels, trimmedLen, sampleRate);
  for (let ch = 0; ch < channels; ch++) {
    trimmed.copyToChannel(output.getChannelData(ch).subarray(0, trimmedLen), ch);
  }
  return trimmed;
}
