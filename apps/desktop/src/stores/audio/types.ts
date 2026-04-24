export interface LoadedTrack {
  id: string;
  buffer: AudioBuffer;          // buffer that actually plays — may be time-stretched
  source: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  volume: number;
  muted: boolean;
  soloed: boolean;
  bpm: number;
  pitch: number;
  trimStart: number;   // seconds from buffer start
  trimEnd: number;     // seconds from buffer start (0 = use full length)
  startOffset: number; // seconds from project start (timeline position)
  // Phase 2: tempo-aware playback metadata. When present, changing the
  // project BPM re-stretches `buffer` from `originalBuffer` so the sample
  // stays locked to the project's grid.
  originalBuffer?: AudioBuffer; // unstretched source (kept so BPM changes can re-stretch)
  detectedBpm?: number;         // sample's native tempo as analysed at upload
  firstBeatOffset?: number;     // seconds from start of ORIGINAL buffer to first detected beat
}

export interface UndoSnapshot {
  trackId: string;
  buffer: AudioBuffer;
  fileId?: string;
}

export interface ArrangementClipState {
  trackId: string;
  trimStart: number;
  trimEnd: number;
  startOffset: number;
  volume: number;
  muted: boolean;
  soloed: boolean;
  pitch: number;
  parentTrackId?: string;
  parentFileId?: string;
}

export interface ArrangementState {
  clips: ArrangementClipState[];
}
