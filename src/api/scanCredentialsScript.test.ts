import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const scannerPath = path.resolve(process.cwd(), '.github/scripts/scan-credentials.mjs')

describe('credential scan script', () => {
  it('detects named keys in toml and yaml assignment styles', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'suno-credential-scan-'))
    const greptileKey = ['GREPTILE', 'API', 'KEY'].join('_')
    const sunoKey = ['SUNO', 'API', 'KEY'].join('_')

    try {
      await writeFile(path.join(workspace, 'config.toml'), `${greptileKey} = "fake-local-value"\n`)
      await writeFile(path.join(workspace, 'settings.yaml'), `${sunoKey}: fake-local-value\n`)

      const result = await runScanner(workspace)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('config.toml:1')
      expect(result.stderr).toContain('settings.yaml:1')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('allows CI secret references without treating them as literal leaks', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'suno-credential-scan-'))
    const greptileKey = ['GREPTILE', 'API', 'KEY'].join('_')
    const secretReference = '${{ secrets.' + greptileKey + ' }}'

    try {
      await writeFile(path.join(workspace, 'workflow.yaml'), `${greptileKey}: ${secretReference}\n`)

      const result = await runScanner(workspace)

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe('')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('allows ordinary task and webhook wording that contains sk hyphen fragments', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'suno-credential-scan-'))

    try {
      await writeFile(path.join(workspace, 'notes.ts'), "const receipt = 'task-update webhook-task-123'\n")

      const result = await runScanner(workspace)

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe('')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

function runScanner(cwd: string): Promise<{ exitCode: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scannerPath], {
      cwd,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += String(chunk)
    })
    child.on('error', reject)
    child.on('close', (exitCode) => {
      resolve({ exitCode, stderr })
    })
  })
}
