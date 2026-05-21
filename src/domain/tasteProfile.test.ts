import { describe, expect, it } from 'vitest'
import { evaluateGenerationTaste, prepareTasteLockedBrief } from './tasteProfile'

describe('liked-track taste profile', () => {
  it('passes restrained prompts that match the liked-track hybrid direction', () => {
    const evaluation = evaluateGenerationTaste({
      brief: 'Bilingual Arabic-English hard rhythmic hybrid with remaster pressure',
      lyrics: 'Sparse verse, pressure pre, direct hook',
      style: 'dynamic bass, melodic metalcore, cinematic synthpop, clean transient punch',
      voice: 'warm controlled custom vocal identity',
    })

    expect(evaluation.passed).toBe(true)
    expect(evaluation.score).toBeGreaterThanOrEqual(5)
    expect(evaluation.matchedSignals).toEqual(
      expect.arrayContaining(['dynamic bass', 'hard rhythmic punch', 'warm controlled vocal identity']),
    )
    expect(evaluation.blockers).toEqual([])
  })

  it('blocks disposable capture-sample language and prepares a stronger provider request', () => {
    const input = {
      brief: 'Neon wire machine choir',
      lyrics: 'Empty line, numbered sky, heart on fire',
      style: 'pop',
      voice: 'voice',
    }
    const evaluation = evaluateGenerationTaste(input)
    const locked = prepareTasteLockedBrief(input, evaluation)

    expect(evaluation.passed).toBe(false)
    expect(evaluation.blockers).toEqual(expect.arrayContaining(['machine choir', 'neon wire', 'empty line']))
    expect(locked.brief).toMatch(/Taste lock:/)
    expect(locked.lyrics).toMatch(/direct, adult, non-novelty writing/i)
    expect(locked.style).toMatch(/dynamic bass, hard rhythmic punch/i)
  })
})
