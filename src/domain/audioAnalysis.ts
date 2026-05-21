export type AudioWaveformInput = {
  trackId: string
  sampleRate: number
  channels: ReadonlyArray<ArrayLike<number>>
}

export type WaveformEnvelopeBucket = {
  index: number
  startSeconds: number
  endSeconds: number
  peak: number
  rms: number
}

export type SilenceRange = {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
}

export type TransientPeak = {
  timeSeconds: number
  strength: number
}

export type EnergySection = {
  label: 'intro' | 'verse' | 'hook' | 'outro'
  startSeconds: number
  endSeconds: number
  peak: number
  rms: number
}

export type WaveformAnalysisReport = {
  trackId: string
  durationSeconds: number
  sampleRate: number
  channelCount: number
  sampleCount: number
  peakAmplitude: number
  rmsAmplitude: number
  crestFactor: number
  dcOffset: number
  clippingSamples: number
  silenceRanges: SilenceRange[]
  transientPeaks: TransientPeak[]
  tempoCandidatesBpm: number[]
  envelope: WaveformEnvelopeBucket[]
  sections: EnergySection[]
  qualityFlags: string[]
}

export type WaveformAnalysisOptions = {
  envelopeBuckets?: number
  silenceThreshold?: number
  minSilenceSeconds?: number
  clippingThreshold?: number
}

export type WaveformFitScore = {
  score: number
  reasons: string[]
  blockers: string[]
}

const sectionLabels: EnergySection['label'][] = ['intro', 'verse', 'hook', 'outro']

export function analyzeWaveformSamples(
  input: AudioWaveformInput,
  options: WaveformAnalysisOptions = {},
): WaveformAnalysisReport {
  if (input.sampleRate <= 0) {
    throw new Error('Waveform analysis requires a positive sample rate')
  }
  if (input.channels.length === 0) {
    throw new Error('Waveform analysis requires at least one audio channel')
  }

  const sampleCount = Math.min(...input.channels.map((channel) => channel.length))
  if (sampleCount === 0) {
    throw new Error('Waveform analysis requires non-empty channel samples')
  }

  const mono = toMono(input.channels, sampleCount)
  const peakAmplitude = maxAbs(mono)
  const rmsAmplitude = rms(mono)
  const crestFactor = rmsAmplitude === 0 ? 0 : peakAmplitude / rmsAmplitude
  const dcOffset = average(mono)
  const clippingThreshold = options.clippingThreshold ?? 0.98
  const clippingSamples = mono.filter((sample) => Math.abs(sample) >= clippingThreshold).length
  const durationSeconds = sampleCount / input.sampleRate
  const silenceRanges = detectSilenceRanges(
    mono,
    input.sampleRate,
    options.silenceThreshold ?? 0.015,
    options.minSilenceSeconds ?? 0.18,
  )
  const envelope = buildEnvelope(mono, input.sampleRate, options.envelopeBuckets ?? 52)
  const sections = buildSections(mono, input.sampleRate)
  const transientPeaks = detectTransientPeaks(mono, input.sampleRate)
  const tempoCandidatesBpm = tempoCandidatesFromTransients(transientPeaks)
  const qualityFlags = qualityFlagsFor({
    clippingSamples,
    durationSeconds,
    peakAmplitude,
    rmsAmplitude,
    silenceRanges,
  })

  return {
    trackId: input.trackId,
    durationSeconds: round(durationSeconds, 3),
    sampleRate: input.sampleRate,
    channelCount: input.channels.length,
    sampleCount,
    peakAmplitude: round(peakAmplitude, 4),
    rmsAmplitude: round(rmsAmplitude, 4),
    crestFactor: round(crestFactor, 3),
    dcOffset: round(dcOffset, 5),
    clippingSamples,
    silenceRanges,
    transientPeaks,
    tempoCandidatesBpm,
    envelope,
    sections,
    qualityFlags,
  }
}

export function scoreWaveformFit(report: WaveformAnalysisReport): WaveformFitScore {
  const blockers: string[] = []
  const reasons: string[] = []
  let score = 3

  const clippingRatio = report.clippingSamples / report.sampleCount
  const hook = report.sections.find((section) => section.label === 'hook')
  const averageSectionRms = average(report.sections.map((section) => section.rms))
  const hasHookLift = Boolean(hook && hook.rms >= averageSectionRms * 1.08)

  if (report.peakAmplitude >= 0.65 && report.rmsAmplitude >= 0.18) {
    score += 1
    reasons.push('strong waveform energy')
  } else {
    reasons.push('low waveform energy')
  }

  if (report.transientPeaks.length >= 6) {
    score += 1
    reasons.push('clear rhythmic transients')
  } else {
    reasons.push('weak transient evidence')
  }

  if (hasHookLift) {
    score += 1
    reasons.push('hook section lifts above average energy')
  }

  if (clippingRatio > 0.01) {
    score -= 2
    blockers.push('clipping above 1% of samples')
  }

  if (report.silenceRanges.some((range) => range.durationSeconds > 1.5)) {
    score -= 1
    blockers.push('long silence range detected')
  }

  return {
    score: clamp(Math.round(score), 1, 5),
    reasons,
    blockers,
  }
}

export function createLikedStyleWaveformFixture(trackId: string): AudioWaveformInput {
  const sampleRate = 1000
  const durationSeconds = 8
  const sampleCount = sampleRate * durationSeconds
  const left = new Float32Array(sampleCount)
  const right = new Float32Array(sampleCount)

  for (let index = 0; index < sampleCount; index += 1) {
    const timeSeconds = index / sampleRate
    const sectionLift = timeSeconds >= 4 && timeSeconds < 6 ? 1.32 : 1
    const bass = Math.sin(2 * Math.PI * 55 * timeSeconds) * 0.2
    const melodic = Math.sin(2 * Math.PI * 220 * timeSeconds) * 0.08
    const kickPhase = timeSeconds % 0.5
    const kick = kickPhase < 0.04 ? (1 - kickPhase / 0.04) * 0.58 : 0
    const pause = timeSeconds >= 2.1 && timeSeconds < 2.32 ? 0 : 1
    const sample = clamp((bass + melodic + kick) * sectionLift * pause, -0.94, 0.94)
    left[index] = sample
    right[index] = sample * 0.96
  }

  return {
    trackId,
    sampleRate,
    channels: [left, right],
  }
}

function toMono(channels: ReadonlyArray<ArrayLike<number>>, sampleCount: number): number[] {
  const mono: number[] = []
  for (let index = 0; index < sampleCount; index += 1) {
    let total = 0
    for (const channel of channels) {
      total += channel[index] ?? 0
    }
    mono.push(total / channels.length)
  }
  return mono
}

function buildEnvelope(samples: number[], sampleRate: number, bucketCount: number): WaveformEnvelopeBucket[] {
  const bucketSize = Math.max(1, Math.floor(samples.length / bucketCount))
  const buckets: WaveformEnvelopeBucket[] = []
  for (let index = 0; index < bucketCount; index += 1) {
    const start = index * bucketSize
    const end = index === bucketCount - 1 ? samples.length : Math.min(samples.length, start + bucketSize)
    const bucketSamples = samples.slice(start, end)
    buckets.push({
      index,
      startSeconds: round(start / sampleRate, 3),
      endSeconds: round(end / sampleRate, 3),
      peak: round(maxAbs(bucketSamples), 4),
      rms: round(rms(bucketSamples), 4),
    })
  }
  return buckets
}

function buildSections(samples: number[], sampleRate: number): EnergySection[] {
  const sectionSize = Math.max(1, Math.floor(samples.length / sectionLabels.length))
  return sectionLabels.map((label, index) => {
    const start = index * sectionSize
    const end = index === sectionLabels.length - 1 ? samples.length : Math.min(samples.length, start + sectionSize)
    const sectionSamples = samples.slice(start, end)
    return {
      label,
      startSeconds: round(start / sampleRate, 3),
      endSeconds: round(end / sampleRate, 3),
      peak: round(maxAbs(sectionSamples), 4),
      rms: round(rms(sectionSamples), 4),
    }
  })
}

function detectSilenceRanges(
  samples: number[],
  sampleRate: number,
  threshold: number,
  minSilenceSeconds: number,
): SilenceRange[] {
  const minSamples = Math.ceil(minSilenceSeconds * sampleRate)
  const ranges: SilenceRange[] = []
  let start: number | null = null

  for (let index = 0; index < samples.length; index += 1) {
    if (Math.abs(samples[index] ?? 0) <= threshold) {
      start ??= index
      continue
    }

    if (start !== null && index - start >= minSamples) {
      ranges.push(toSilenceRange(start, index, sampleRate))
    }
    start = null
  }

  if (start !== null && samples.length - start >= minSamples) {
    ranges.push(toSilenceRange(start, samples.length, sampleRate))
  }

  return ranges
}

function detectTransientPeaks(samples: number[], sampleRate: number): TransientPeak[] {
  const windowSize = Math.max(8, Math.round(sampleRate * 0.04))
  const energies: number[] = []
  for (let start = 0; start < samples.length; start += windowSize) {
    energies.push(rms(samples.slice(start, Math.min(samples.length, start + windowSize))))
  }

  const peaks: TransientPeak[] = []
  for (let index = 1; index < energies.length; index += 1) {
    const previous = energies[index - 1] ?? 0
    const current = energies[index] ?? 0
    const delta = current - previous
    if (current >= 0.18 && delta >= 0.06 && current >= previous * 1.28) {
      peaks.push({
        timeSeconds: round((index * windowSize) / sampleRate, 3),
        strength: round(delta, 4),
      })
    }
  }

  return peaks
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 16)
    .sort((left, right) => left.timeSeconds - right.timeSeconds)
}

function tempoCandidatesFromTransients(peaks: TransientPeak[]): number[] {
  if (peaks.length < 3) {
    return []
  }

  const intervals = peaks
    .slice(1)
    .map((peak, index) => peak.timeSeconds - (peaks[index]?.timeSeconds ?? 0))
    .filter((interval) => interval >= 0.24 && interval <= 1.5)
    .sort((left, right) => left - right)

  if (intervals.length === 0) {
    return []
  }

  const median = intervals[Math.floor(intervals.length / 2)] ?? intervals[0]
  const baseBpm = normalizeBpm(60 / median)
  const candidates = [baseBpm, baseBpm * 2, baseBpm / 2]
    .map((candidate) => Math.round(normalizeBpm(candidate)))
    .filter((candidate, index, array) => candidate >= 70 && candidate <= 190 && array.indexOf(candidate) === index)

  return candidates.slice(0, 3)
}

function qualityFlagsFor(input: {
  clippingSamples: number
  durationSeconds: number
  peakAmplitude: number
  rmsAmplitude: number
  silenceRanges: SilenceRange[]
}): string[] {
  const flags: string[] = []
  if (input.clippingSamples > 0) {
    flags.push('clipping-detected')
  }
  if (input.peakAmplitude < 0.3 || input.rmsAmplitude < 0.08) {
    flags.push('low-energy')
  }
  if (input.silenceRanges.some((range) => range.durationSeconds > Math.min(1.5, input.durationSeconds * 0.2))) {
    flags.push('long-silence')
  }
  if (flags.length === 0) {
    flags.push('clean-dynamic-waveform')
  }
  return flags
}

function toSilenceRange(start: number, end: number, sampleRate: number): SilenceRange {
  return {
    startSeconds: round(start / sampleRate, 3),
    endSeconds: round(end / sampleRate, 3),
    durationSeconds: round((end - start) / sampleRate, 3),
  }
}

function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) {
    return 0
  }
  let total = 0
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] ?? 0
    total += sample * sample
  }
  return Math.sqrt(total / samples.length)
}

function maxAbs(samples: ArrayLike<number>): number {
  let peak = 0
  for (let index = 0; index < samples.length; index += 1) {
    peak = Math.max(peak, Math.abs(samples[index] ?? 0))
  }
  return peak
}

function average(samples: ArrayLike<number>): number {
  if (samples.length === 0) {
    return 0
  }
  let total = 0
  for (let index = 0; index < samples.length; index += 1) {
    total += samples[index] ?? 0
  }
  return total / samples.length
}

function normalizeBpm(bpm: number): number {
  let normalized = bpm
  while (normalized < 70) {
    normalized *= 2
  }
  while (normalized > 190) {
    normalized /= 2
  }
  return normalized
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}
