const endpoint = 'https://api.greptile.com/mcp'
const apiKey = process.env.GREPTILE_API_KEY
const repository = process.env.GITHUB_REPOSITORY
const prNumber = Number(process.env.PR_NUMBER)
const branch = process.env.PR_HEAD_REF
const headSha = process.env.PR_HEAD_SHA
const defaultBranch = process.env.PR_BASE_REF || 'main'

if (!apiKey) {
  console.error('::error::GREPTILE_API_KEY repository secret is required for PR review enforcement')
  process.exit(1)
}

if (!repository || !prNumber || !branch || !headSha) {
  console.error('::error::Missing pull request metadata for Greptile review')
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

function newestForHead(reviews, sha) {
  return [...reviews]
    .filter((review) => review.commitSha === sha)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
}

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
