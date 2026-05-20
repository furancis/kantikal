import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import type { SunoProvider } from './api/provider'
import type { GenerationBatch } from './domain/workflow'

describe('Suno Visual Studio shell', () => {
  it('keeps the music video lane subordinate to the song workflow', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /visual music generation operating app/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeDisabled()
    expect(screen.getByText(/select a generated track before opening video/i)).toBeInTheDocument()
    expect(screen.getByText(/54 mapped capabilities/i)).toBeInTheDocument()
    expect(screen.getByText(/custom voice creation/i)).toBeInTheDocument()
    expect(screen.getByText(/^WAV conversion$/i)).toBeInTheDocument()
  })

  it('creates editable workflow objects from the visual app', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('heading', { name: /perfect lipsync gate/i })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.clear(screen.getByLabelText(/lyrics/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/lyrics/i, { selector: 'textarea' }), 'Verse pre chorus')
    await user.clear(screen.getByLabelText(/style/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/style/i, { selector: 'input' }), 'Gulf percussion and electro-pop')
    await user.clear(screen.getByLabelText(/voice/i, { selector: 'input' }))
    await user.type(screen.getByLabelText(/voice/i, { selector: 'input' }), 'Consented bright tenor persona')

    await user.click(screen.getByRole('button', { name: /generate mock suno batch/i }))

    expect(await screen.findByRole('button', { name: /neon khaliji club hook v1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neon khaliji club hook v2/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /neon khaliji club hook v2/i }))

    expect(screen.getByRole('heading', { name: /chosen track/i })).toBeInTheDocument()
    expect(screen.getByText(/selected source: mock-track-2/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /open music video lane/i }))

    expect(screen.getByRole('heading', { name: /perfect lipsync gate/i })).toBeInTheDocument()
    expect(screen.getByText(/segment drift/i)).toBeInTheDocument()
    expect(screen.getByText(/post-stitch/i)).toBeInTheDocument()
    expect(screen.getByText(/full suno api parity map/i)).toBeInTheDocument()
    expect(screen.getByText(/archive-first destructive cleanup/i)).toBeInTheDocument()
    expect(screen.getByText(/music video source: mock-track-2/i)).toBeInTheDocument()
  })

  it('surfaces provider failures instead of dropping rejected generation promises', async () => {
    const user = userEvent.setup()
    const failingProvider: SunoProvider = {
      async generateBatch() {
        throw new Error('Provider rate limit')
      },
    }

    render(<App provider={failingProvider} />)

    await user.click(screen.getByRole('button', { name: /generate mock suno batch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/provider rate limit/i)
    expect(screen.queryByRole('button', { name: /gulf chorus engine v1/i })).not.toBeInTheDocument()
  })

  it('clears stale generated tracks and video selection when the brief changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Neon khaliji club hook')
    await user.click(screen.getByRole('button', { name: /generate mock suno batch/i }))
    await user.click(await screen.findByRole('button', { name: /neon khaliji club hook v2/i }))

    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeEnabled()

    await user.clear(screen.getByLabelText(/brief/i, { selector: 'textarea' }))
    await user.type(screen.getByLabelText(/brief/i, { selector: 'textarea' }), 'Fresh hook')

    expect(screen.queryByRole('button', { name: /neon khaliji club hook v1/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /neon khaliji club hook v2/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /chosen track/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open music video lane/i })).toBeDisabled()
  })

  it('disables every generation entry point while provider work is in flight', async () => {
    const user = userEvent.setup()
    let resolveBatch: (batch: GenerationBatch) => void = () => {
      throw new Error('Slow provider was not called')
    }
    const slowProvider: SunoProvider = {
      generateBatch() {
        return new Promise<GenerationBatch>((resolve) => {
          resolveBatch = resolve
        })
      },
    }

    render(<App provider={slowProvider} />)

    await user.click(screen.getByRole('button', { name: /run generation/i }))

    expect(screen.getByRole('button', { name: /run generation/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /generate mock suno batch/i })).toBeDisabled()

    resolveBatch({
      providerJobId: 'slow-provider',
      tracks: [{ id: 'slow-track-1', title: 'Slow provider v1', durationSeconds: 150 }],
    })

    expect(await screen.findByRole('button', { name: /slow provider v1/i })).toBeInTheDocument()
  })
})
