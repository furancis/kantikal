import { describe, expect, it } from 'vitest'
import {
  createMockSunoProvider,
  createProviderRuntimeConfig,
  publicProviderStatus,
} from './provider'

describe('Suno provider boundary', () => {
  it('keeps provider credentials on the server side', () => {
    expect(() =>
      createProviderRuntimeConfig({
        runtime: 'client',
        apiKey: 'secret-key',
      }),
    ).toThrow(/server-side/i)

    expect(
      createProviderRuntimeConfig({
        runtime: 'server',
        apiKey: 'secret-key',
        baseUrl: 'https://api.sunoapi.org',
      }),
    ).toMatchObject({
      runtime: 'server',
      baseUrl: 'https://api.sunoapi.org',
      hasApiKey: true,
      credentialMode: 'server-injected',
    })
  })

  it('exposes only redacted provider state to the client', () => {
    const status = publicProviderStatus(
      createProviderRuntimeConfig({
        runtime: 'server',
        apiKey: 'secret-key',
        baseUrl: 'https://api.sunoapi.org',
      }),
    )

    expect(status).toEqual({
      provider: 'suno-compatible',
      baseUrl: 'https://api.sunoapi.org',
      hasApiKey: true,
      credentialMode: 'server-injected',
    })
    expect(JSON.stringify(status)).not.toContain('secret-key')
  })

  it('generates deterministic mocked batches without real credentials', async () => {
    const provider = createMockSunoProvider()

    const batch = await provider.generateBatch({
      brief: 'cinematic Arabic club-pop',
      lyrics: 'hook line',
      style: 'electro-pop',
      voice: 'consented persona',
      count: 2,
    })

    expect(batch.providerJobId).toMatch(/^mock_suno_/)
    expect(batch.tracks).toHaveLength(2)
    expect(batch.tracks[0]).toMatchObject({
      id: 'mock-track-1',
      title: 'cinematic Arabic club-pop v1',
    })
  })
})
