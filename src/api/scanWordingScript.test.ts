import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const scannerPath = path.resolve(process.cwd(), '.github/scripts/scan-wording.mjs')

describe('wording scan script', () => {
  it('detects forbidden terms in toml files', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'suno-wording-scan-'))
    const blockedTerm = ['arti', 'facts'].join('')

    try {
      await writeFile(path.join(workspace, 'config.toml'), `label = "${blockedTerm}"\n`)

      const result = await runScanner(workspace)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('config.toml:1')
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
