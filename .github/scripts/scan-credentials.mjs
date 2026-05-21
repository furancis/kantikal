import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const ignoredDirectories = new Set([
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
])
const credentialPattern =
  /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{20,}|hfp_[A-Za-z0-9]{20,}|(?:GREPTILE_API_KEY|SUNO_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|HF_TOKEN)\s*[:=]\s*(?!\$\{\{|\$\w|\$env:|process\.env|import\.meta\.env|undefined|null)[^\s#]+|Bearer\s+[A-Za-z0-9._-]{20,}/
const credentialFileNames = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
])
const textFileExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.toml',
  '.yml',
  '.yaml',
])

const matches = []

async function scanDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await scanDirectory(path.join(directory, entry.name))
      }
      continue
    }

    if (!entry.isFile() || (!textFileExtensions.has(path.extname(entry.name)) && !credentialFileNames.has(entry.name))) {
      continue
    }

    const filePath = path.join(directory, entry.name)
    const text = await readFile(filePath, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (credentialPattern.test(line)) {
        matches.push(`${path.relative(root, filePath)}:${index + 1}`)
      }
    })
  }
}

await scanDirectory(root)

if (matches.length > 0) {
  console.error(`Credential-like literal found:\n${matches.join('\n')}`)
  process.exit(1)
}

console.log('No credential-like literals found')
