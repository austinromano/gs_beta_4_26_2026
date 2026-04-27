import { useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { getAnalyser } from '../../stores/audio/graph';
import { TRACK_HEADER_WIDTH } from './ArrangementComponents';

/**
 * Master track — always-present lane at the bottom of the arrangement.
 * Holds the master fader and the post-master level meter (reads off the
 * masterAnalyser that taps the master output in parallel). Cannot be
 * reordered, dragged, or deleted; it's not a "track" in the data model,
 * just the control surface for the master bus.
 */
export default function MasterTrackLane() {
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const meterLeftRef = useRef<HTMLDivElement>(null);
  const meterRightRef = useRef<HTMLDivElement>(null);
  const peakLeftRef = useRef<HTMLDivElement>(null);
  const peakRightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Drive the meter from the master analyser via rAF. Computes peak-RMS
  // hybrid per channel so the bar reflects perceived loudness without
  // missing transient peaks (Logic / Live both do something similar).
  useEffect(() => {
    const analyser = getAnalyser();
    if (!analyser) return;

    const buf = new Float32Array(analyser.fftSize);
    let peakHoldL = 0;
    let peakHoldR = 0;
    let lastPeakDecay = performance.now();

    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      // Master analyser is mono-summed (single channel input from the
      // master gain). Render the same level on both meter bars so the
      // visual matches a real DAW two-channel meter even when the source
      // chain is summed. A future stereo upgrade swaps this for two
      // channel splits off masterGain.
      let peak = 0;
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i];
        const abs = v < 0 ? -v : v;
        if (abs > peak) peak = abs;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buf.length);
      // Mix peak + RMS for a punchy but readable level. dB scaled to
      // [-60dB, 0dB] mapped to [0, 1] for the bar width.
      const linear = peak * 0.7 + rms * 0.3;
      const db = linear > 0 ? 20 * Math.log10(linear) : -100;
      const normalized = Math.max(0, Math.min(1, (db + 60) / 60));

      if (meterLeftRef.current) meterLeftRef.current.style.width = `${normalized * 100}%`;
      if (meterRightRef.current) meterRightRef.current.style.width = `${normalized * 100}%`;

      // Peak hold dots — fall back at ~12 dB/sec.
      const now = performance.now();
      const decay = (now - lastPeakDecay) / 1000;
      lastPeakDecay = now;
      peakHoldL = Math.max(normalized, peakHoldL - decay * 0.2);
      peakHoldR = Math.max(normalized, peakHoldR - decay * 0.2);
      if (peakLeftRef.current) peakLeftRef.current.style.left = `${peakHoldL * 100}%`;
      if (peakRightRef.current) peakRightRef.current.style.left = `${peakHoldR * 100}%`;

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Volume is unitless 0..1.5 (1 = unity, 1.5 = +3.5 dB headroom). Slider
  // step is fine enough to feel continuous but not so fine that
  // setMasterVolume gets spammed.
  const dbReadout = masterVolume > 0
    ? `${(20 * Math.log10(masterVolume)).toFixed(1)} dB`
    : '−∞ dB';

  return (
    <div className="flex items-stretch border-t border-white/[0.08]" style={{ height: 56, background: 'linear-gradient(180deg, rgba(20,8,32,0.9), rgba(10,4,18,0.95))' }}>
      <div
        style={{ width: TRACK_HEADER_WIDTH }}
        className="shrink-0 relative border-r border-white/[0.06] flex flex-col justify-center px-2"
      >
        {/* Identity stripe — gold to set master apart from regular tracks. */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 4, background: 'linear-gradient(180deg, #F5C518, #D4A017)', boxShadow: '0 0 8px rgba(245,197,24,0.4)' }}
        />
        <div className="pl-3 flex items-center justify-between gap-2 mb-1">
          <span className="text-white text-[11px] font-bold tracking-tight">MASTER</span>
          <span className="text-white/50 text-[9px] font-mono tabular-nums">{dbReadout}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-full pl-3"
          style={{ accentColor: '#F5C518' }}
          aria-label="Master volume"
        />
      </div>
      <div className="flex-1 relative px-3 py-2 flex flex-col justify-center gap-1">
        {/* Two-bar level meter. The 0 dB tick at 100% is visually marked
            with a vertical line so the user can spot when they're
            slamming the master. */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            ref={meterLeftRef}
            className="absolute top-0 bottom-0 left-0"
            style={{ width: '0%', background: 'linear-gradient(90deg, #00FFC8 0%, #00FFC8 60%, #F5C518 80%, #FF4444 100%)', transition: 'width 30ms linear' }}
          />
          <div
            ref={peakLeftRef}
            className="absolute top-0 bottom-0"
            style={{ left: '0%', width: 1, background: 'rgba(255,255,255,0.85)' }}
          />
        </div>
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            ref={meterRightRef}
            className="absolute top-0 bottom-0 left-0"
            style={{ width: '0%', background: 'linear-gradient(90deg, #00FFC8 0%, #00FFC8 60%, #F5C518 80%, #FF4444 100%)', transition: 'width 30ms linear' }}
          />
          <div
            ref={peakRightRef}
            className="absolute top-0 bottom-0"
            style={{ left: '0%', width: 1, background: 'rgba(255,255,255,0.85)' }}
          />
        </div>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/25 text-[10px] uppercase tracking-wider">Master out</span>
          </div>
        )}
      </div>
    </div>
  );
}
