import { describe, expect, it } from 'vitest'
import {
  analyzeWaveformSamples,
  createLikedStyleWaveformFixture,
  scoreWaveformFit,
} from './audioAnalysis'

describe('audio waveform analysis', () => {
  it('detects waveform energy, silence, transients and section lift from PCM samples', () => {
    const report = analyzeWaveformSamples(createLikedStyleWaveformFixture('liked-track'))

    expect(report.trackId).toBe('liked-track')
    expect(report.durationSeconds).toBe(8)
    expect(report.channelCount).toBe(2)
    expect(report.peakAmplitude).toBeGreaterThan(0.7)
    expect(report.rmsAmplitude).toBeGreaterThan(0.18)
    expect(report.silenceRanges).toEqual([
      expect.objectContaining({
        startSeconds: expect.closeTo(2.1, 1),
        endSeconds: expect.closeTo(2.32, 1),
      }),
    ])
    expect(report.transientPeaks.length).toBeGreaterThanOrEqual(6)
    expect(report.tempoCandidatesBpm.some((bpm) => bpm >= 110 && bpm <= 130)).toBe(true)
    expect(report.sections.find((section) => section.label === 'hook')?.rms).toBeGreaterThan(
      report.sections.find((section) => section.label === 'verse')?.rms ?? 0,
    )
    expect(report.qualityFlags).toEqual(['clean-dynamic-waveform'])
  })

  it('lowers fit when clipping and long silence make a branch risky', () => {
    const sampleRate = 1000
    const samples = new Float32Array(sampleRate * 4)
    samples.fill(0)
    samples.fill(1, 2200, 2300)

    const report = analyzeWaveformSamples({
      trackId: 'clipped-branch',
      sampleRate,
      channels: [samples],
    })
    const fit = scoreWaveformFit(report)

    expect(report.clippingSamples).toBe(100)
    expect(report.qualityFlags).toEqual(expect.arrayContaining(['clipping-detected', 'long-silence']))
    expect(fit.score).toBeLessThanOrEqual(2)
    expect(fit.blockers).toEqual(expect.arrayContaining(['clipping above 1% of samples']))
  })
})
