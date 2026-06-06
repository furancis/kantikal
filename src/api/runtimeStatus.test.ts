import { describe, expect, it } from 'vitest'
import { createFetchRuntimeStatusClient, createLocalRuntimeStatusClient } from './runtimeStatus'

describe('runtime status client', () => {
  it('loads mounted runtime status', async () => {
    const client = createFetchRuntimeStatusClient({
      fetchImpl: async (url) => {
        expect(String(url)).toBe('/api/runtime/status')
        return new Response(
          JSON.stringify({
            status: {
              provider: {
                state: 'online',
                providerMode: 'live',
                productOrigin: 'https://provider.com',
                apiBaseUrl: 'https://api.providerapi.org',
                apiV1BaseUrl: 'https://api.providerapi.org/api/v1',
                uploadBaseUrl: 'https://providerapiorg.redpandaai.co',
                credential: 'present',
                message:
                  'Optional compatible-provider adapter credential accepted by the remaining-credits endpoint; Printing Press remains primary unless this adapter is explicitly chosen.',
              },
              comfy: {
                state: 'online',
                baseUrl: 'http://127.0.0.1:8188',
                version: '0.21.0',
                device: 'cuda:0 RTX 5090',
                modelRoot: 'D:\\Dev\\ComfyUI\\ComfyUI\\models',
                modelCount: 2,
                models: ['ltx-2.3-22b-dev-fp8.safetensors', 'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors'],
                message: 'ComfyUI ready',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    })

    await expect(client.load()).resolves.toMatchObject({
      provider: { credential: 'present' },
      comfy: { state: 'online', modelCount: 2 },
    })
  })

  it('falls back only when the route is absent or unreachable', async () => {
    const fallback = createLocalRuntimeStatusClient()
    const client = createFetchRuntimeStatusClient({
      fallback,
      fetchImpl: async () => new Response('', { status: 404 }),
    })

    await expect(client.load()).resolves.toMatchObject({
      provider: { apiBaseUrl: 'https://api.providerapi.org' },
      comfy: { state: 'offline' },
    })

    await expect(client.load()).resolves.toMatchObject({
      provider: { message: expect.stringContaining('Printing Press') },
    })
  })

  it('surfaces mounted route failures', async () => {
    const client = createFetchRuntimeStatusClient({
      fetchImpl: async () => new Response('bad', { status: 500 }),
    })

    await expect(client.load()).rejects.toThrow(/HTTP 500/)
  })
})
