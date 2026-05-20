import type { GenerationBatch } from '../domain/workflow'

export type ProviderRuntimeConfigInput = {
  runtime: 'server' | 'client'
  apiKey?: string
}

export type ProviderRuntimeConfig = {
  runtime: 'server'
  hasApiKey: boolean
}

export type GenerateBatchRequest = {
  brief: string
  lyrics: string
  style: string
  voice: string
  count: number
}

export type SunoProvider = {
  generateBatch(request: GenerateBatchRequest): Promise<GenerationBatch>
}

export function createProviderRuntimeConfig(
  input: ProviderRuntimeConfigInput,
): ProviderRuntimeConfig {
  if (input.runtime !== 'server') {
    throw new Error('Provider credentials must remain server-side')
  }

  return {
    runtime: 'server',
    hasApiKey: Boolean(input.apiKey),
  }
}

export function createMockSunoProvider(): SunoProvider {
  return {
    async generateBatch(request) {
      if (request.count < 1) {
        throw new Error('Mock Suno provider requires at least one track')
      }

      return {
        providerJobId: `mock_suno_${slugify(request.brief)}`,
        tracks: Array.from({ length: request.count }, (_, index) => ({
          id: `mock-track-${index + 1}`,
          title: `${request.brief} v${index + 1}`,
          durationSeconds: 150 + index * 4,
        })),
      }
    },
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
