export const WAVEFORM_POINTS = 240

/** Downsample audio to `buckets` peak values. */
export function computePeaks(samples: Float32Array, buckets: number): number[] {
  if (buckets <= 0 || samples.length === 0) return []
  const size = samples.length / buckets
  const out: number[] = []
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * size)
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((b + 1) * size)))
    let max = 0
    for (let i = start; i < end; i++) max = Math.max(max, Math.abs(samples[i]))
    out.push(max)
  }
  return out
}

/** Peaks scaled to 0..1 and rounded to 3 decimals, compact enough to store and send as JSON. */
export function toWaveform(samples: Float32Array, points: number = WAVEFORM_POINTS): number[] {
  const peaks = computePeaks(samples, points)
  const max = Math.max(0, ...peaks)
  return peaks.map((v) => (max > 0 ? Math.round((v / max) * 1000) / 1000 : 0))
}
