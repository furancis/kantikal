const endpoint = 'https://api.greptile.com/mcp'
const apiKey = process.env.GREPTILE_API_KEY
const githubToken = process.env.GITHUB_TOKEN
const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com'
const repository = process.env.GITHUB_REPOSITORY
const eventName = process.env.GITHUB_EVENT_NAME
const prHeadRepository = process.env.PR_HEAD_REPOSITORY
const isCrossRepository = prHeadRepository ? prHeadRepository !== repository : process.env.PR_IS_CROSS_REPO === 'true'
let prNumber = Number(process.env.PR_NUMBER)
let branch = process.env.PR_HEAD_REF
let headSha = process.env.PR_HEAD_SHA
let defaultBranch = process.env.PR_BASE_REF || 'main'

if (!repository || !branch || !headSha) {
  console.error('::error::Missing repository or head metadata for Greptile review')
  process.exit(1)
}

let rpcId = 1

async function callGreptileTool(name, args) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId++,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Greptile HTTP ${response.status}: ${raw.slice(0, 500)}`)
  }

  const payload = raw.startsWith('event:')
    ? raw
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n')
    : raw

  const rpc = JSON.parse(payload)
  if (rpc.error) {
    throw new Error(`Greptile RPC ${rpc.error.code}: ${rpc.error.message}`)
  }

  const textContent = rpc.result?.content?.[0]?.text
  return textContent ? JSON.parse(textContent) : rpc.result
}

async function githubGet(pathname) {
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required for Greptile status-check fallback')
  }

  const response = await fetch(`${githubApiUrl}${pathname}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`GitHub HTTP ${response.status}: ${text.slice(0, 500)}`)
  }
  return JSON.parse(text)
}

function newestForHead(reviews, sha) {
  return [...reviews]
    .filter((review) => review.commitSha === sha)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
}

function isExternalGreptileName(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  return normalized.includes('greptile') && !normalized.includes('greptile-review')
}

async function resolvePullRequestMetadataForBranch() {
  if (prNumber) {
    return
  }

  const [owner] = repository.split('/')
  const pulls = await githubGet(`/repos/${repository}/pulls?head=${owner}:${encodeURIComponent(branch)}&state=open`)
  const pull = pulls.find((candidate) => candidate.head?.sha === headSha) ?? pulls[0]
  if (!pull) {
    console.log(`No open pull request found for ${branch}; skipping Greptile PR review`)
    process.exit(0)
  }

  prNumber = pull.number
  branch = pull.head.ref
  headSha = pull.head.sha
  defaultBranch = pull.base.ref || defaultBranch
}

async function waitForGreptileStatusCheck() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const encodedRef = encodeURIComponent(headSha)
    const checkRuns = await githubGet(`/repos/${repository}/commits/${encodedRef}/check-runs`)
    const statusRollup = await githubGet(`/repos/${repository}/commits/${encodedRef}/status`)
    const greptileCheck = (checkRuns.check_runs ?? []).find((check) => isExternalGreptileName(check.name))
    const greptileStatus = (statusRollup.statuses ?? []).find((status) => isExternalGreptileName(status.context))

    if (greptileCheck) {
      console.log(`Greptile app check is ${greptileCheck.status}/${greptileCheck.conclusion ?? 'pending'}`)
      if (greptileCheck.status === 'completed') {
        if (greptileCheck.conclusion === 'success') {
          return
        }
        throw new Error(`Greptile app check concluded ${greptileCheck.conclusion}`)
      }
    } else if (greptileStatus) {
      console.log(`Greptile app status is ${greptileStatus.state}`)
      if (greptileStatus.state === 'success') {
        return
      }
      if (['failure', 'error'].includes(greptileStatus.state)) {
        throw new Error(`Greptile app status is ${greptileStatus.state}`)
      }
    } else {
      console.log(`Waiting for Greptile app check on ${headSha}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 10000))
  }

  throw new Error(`Greptile app check did not complete for ${headSha}`)
}

if (!apiKey) {
  if (eventName === 'push') {
    console.log('GREPTILE_API_KEY is unavailable in this push context; skipping keyed Greptile review')
    process.exit(0)
  }
  if (eventName === 'pull_request' && !isCrossRepository) {
    console.log('GREPTILE_API_KEY is unavailable in this same-repo PR context; keyed push workflow enforces Greptile review')
    process.exit(0)
  }
  console.log('GREPTILE_API_KEY is unavailable in this PR context; enforcing external Greptile app status check instead')
  await waitForGreptileStatusCheck()
  console.log('Greptile app status check passed')
  process.exit(0)
}

await resolvePullRequestMetadataForBranch()

await callGreptileTool('trigger_code_review', {
  name: repository,
  remote: 'github',
  defaultBranch,
  branch,
  prNumber,
})

let review
for (let attempt = 0; attempt < 60; attempt += 1) {
  const result = await callGreptileTool('list_code_reviews', {
    name: repository,
    remote: 'github',
    defaultBranch,
    prNumber,
    limit: 10,
  })

  review = newestForHead(result.codeReviews ?? result.reviews ?? [], headSha)
  if (review) {
    console.log(`Greptile review ${review.id} is ${review.status}`)
    if (['COMPLETED', 'FAILED', 'SKIPPED'].includes(review.status)) {
      break
    }
  } else {
    console.log(`Waiting for Greptile review on ${headSha}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 10000))
}

if (!review) {
  console.error(`::error::No Greptile review found for PR head ${headSha}`)
  process.exit(1)
}

if (review.status !== 'COMPLETED') {
  console.error(`::error::Greptile review ${review.id} ended with status ${review.status}`)
  process.exit(1)
}

const comments = await callGreptileTool('list_merge_request_comments', {
  name: repository,
  remote: 'github',
  defaultBranch,
  prNumber,
  greptileGenerated: true,
  addressed: false,
  createdAfter: review.createdAt,
})

const openComments = comments.comments ?? []
if (openComments.length > 0) {
  console.error(`::error::Greptile reported ${openComments.length} unaddressed comment(s)`)
  for (const comment of openComments.slice(0, 5)) {
    console.error(`${comment.filePath}:${comment.lineStart}-${comment.lineEnd}`)
  }
  process.exit(1)
}

console.log(`Greptile review ${review.id} passed with no unaddressed comments`)
