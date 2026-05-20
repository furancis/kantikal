import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('Suno Visual Studio shell', () => {
  it('keeps the music video lane subordinate to the song workflow', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /visual music generation operating app/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /music video lane/i })).toHaveTextContent(
      /subfeature of the song/i,
    )
  })

  it('exposes full-shape anchors in the inspector', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /music video lane/i }))

    expect(screen.getByRole('heading', { name: /perfect lipsync gate/i })).toBeInTheDocument()
    expect(screen.getByText(/full suno api parity map/i)).toBeInTheDocument()
    expect(screen.getByText(/archive-first destructive cleanup/i)).toBeInTheDocument()
  })
})
