import { describe, expect, it } from 'vitest'
import { apiCoverageEntries, providerAdapterActions } from './coverage'
import {
  actionStateForEntry,
  assertProviderActionCatalogCovers,
  providerActionDefinitions,
} from './actionCatalog'

describe('provider action catalog', () => {
  it('turns every mapped adapter action into an executable or explicit blocked action', () => {
    const actions = providerAdapterActions(apiCoverageEntries)

    expect(() => assertProviderActionCatalogCovers(actions)).not.toThrow()
    expect(providerActionDefinitions.map((definition) => definition.action)).toEqual(
      expect.arrayContaining(actions),
    )
  })

  it('keeps endpoint-backed actions server-owned and unsupported product actions explicit', () => {
    expect(providerActionDefinitions.find((definition) => definition.action === 'generateLyrics')).toMatchObject({
      method: 'POST',
      path: '/api/v1/lyrics',
      authBoundary: 'server',
      execution: 'server-ready',
    })
    expect(providerActionDefinitions.find((definition) => definition.action === 'listLibrary')).toMatchObject({
      execution: 'unsupported',
      authBoundary: 'server',
    })
  })

  it('derives truthful UI action states from coverage plus the action catalog', () => {
    const createSong = apiCoverageEntries.find((entry) => entry.capability === 'Create song')
    const lyrics = apiCoverageEntries.find((entry) => entry.capability === 'Lyrics generation')
    const library = apiCoverageEntries.find((entry) => entry.capability === 'Library list/search')

    expect(createSong && actionStateForEntry(createSong)).toMatchObject({
      execution: 'mock-live',
      buttonLabel: 'Run mock action',
    })
    expect(lyrics && actionStateForEntry(lyrics)).toMatchObject({
      execution: 'server-ready',
      buttonLabel: 'Check server action',
    })
    expect(library && actionStateForEntry(library)).toMatchObject({
      execution: 'unsupported',
      buttonLabel: 'Show unsupported state',
    })
  })

  it('keeps action ownership aligned with the coverage map', () => {
    const mismatched = apiCoverageEntries
      .map((entry) => ({ entry, definition: actionStateForEntry(entry) }))
      .filter(({ entry, definition }) => entry.authBoundary !== definition.authBoundary)

    expect(mismatched).toEqual([])
  })

  it('models webhooks as inbound server handlers instead of outgoing provider calls', () => {
    const webhooks = apiCoverageEntries.find((entry) => entry.capability === 'Webhooks/retries')

    expect(webhooks && actionStateForEntry(webhooks)).toMatchObject({
      execution: 'inbound-handler',
      authBoundary: 'server',
      path: '/api/provider/callback',
      buttonLabel: 'Show inbound handler',
    })
  })
})
