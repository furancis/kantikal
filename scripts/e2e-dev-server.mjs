import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

/* global process */

for (const path of ['.kantikal/e2e.sqlite', '.kantikal/e2e.sqlite-shm', '.kantikal/e2e.sqlite-wal']) {
  rmSync(path, { force: true })
}

const env = {
  ...process.env,
  SUNO_PROVIDER_MODE: 'fixture',
  KANTIKAL_DB_PATH: '.kantikal/e2e.sqlite',
  VITE_ALLOW_FIXTURE_AUDIO: '1',
  VITE_ALLOW_FIXTURE_LIPSYNC: '1',
}

const child = spawn('npm run dev -- --host 127.0.0.1 --port 4174', {
  env,
  shell: true,
  stdio: 'inherit',
})

process.on('SIGTERM', () => child.kill('SIGTERM'))
process.on('SIGINT', () => child.kill('SIGINT'))

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
