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
const forbiddenRoot = 'arti'
const forbiddenPattern = new RegExp(`claude ${forbiddenRoot}facts|${forbiddenRoot}facts|${forbiddenRoot}fact`, 'i')
const textFileExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
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

    if (!entry.isFile() || !textFileExtensions.has(path.extname(entry.name))) {
      continue
    }

    const filePath = path.join(directory, entry.name)
    const text = await readFile(filePath, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (forbiddenPattern.test(line)) {
        matches.push(`${path.relative(root, filePath)}:${index + 1}`)
      }
    })
  }
}

await scanDirectory(root)

if (matches.length > 0) {
  console.error(`Forbidden product wording found:\n${matches.join('\n')}`)
  process.exit(1)
}

console.log('No forbidden product wording found')
