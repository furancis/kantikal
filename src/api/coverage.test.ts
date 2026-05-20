import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  apiCoverageEntries,
  apiCoverageStatusCounts,
  assertApiCoverageComplete,
  documentedCapabilities,
  providerAdapterActions,
} from './coverage'

describe('API coverage enforcement', () => {
  it('keeps every documented capability represented in the typed manifest', () => {
    const docs = readFileSync('docs/api-coverage.md', 'utf8')
    const manifestCapabilities = apiCoverageEntries.map((entry) => entry.capability)

    expect(manifestCapabilities).toEqual(documentedCapabilities(docs))
    expect(() => assertApiCoverageComplete(apiCoverageEntries)).not.toThrow()
  })

  it('requires every mapped capability to name UI, backend, status, auth boundary, and adapter action', () => {
    for (const entry of apiCoverageEntries) {
      expect(entry.uiSurface.length).toBeGreaterThan(0)
      expect(entry.backendOwner.length).toBeGreaterThan(0)
      expect(entry.adapterAction.length).toBeGreaterThan(0)
      expect(['implemented', 'planned', 'blocked', 'unsupported', 'deprecated']).toContain(entry.status)
      expect(['server', 'none', 'external-worker']).toContain(entry.authBoundary)
    }
  })

  it('has server-only adapter actions for provider-backed capabilities', () => {
    const providerActions = providerAdapterActions(apiCoverageEntries)

    expect(providerActions).toEqual(
      expect.arrayContaining([
        'generateBatch',
        'extendTrack',
        'uploadAndCover',
        'uploadAndExtend',
        'pollGenerationStatus',
        'separateStems',
      ]),
    )
    expect(apiCoverageEntries.filter((entry) => entry.authBoundary === 'server').length).toBeGreaterThan(10)
  })

  it('summarizes implementation state without hiding planned work', () => {
    const counts = apiCoverageStatusCounts(apiCoverageEntries)

    expect(counts.implemented).toBe(3)
    expect(counts.planned).toBeGreaterThan(30)
    expect(counts.unsupported).toBeGreaterThan(0)
    expect(counts.blocked).toBe(0)
    expect(counts.deprecated).toBe(0)
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(apiCoverageEntries.length)
  })
})
