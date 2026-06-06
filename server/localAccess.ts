export function assertLocalBrowserWrite(request: Request): void {
  const origin = request.headers.get('origin')
  const secFetchSite = request.headers.get('sec-fetch-site')

  if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    throw new LocalAccessError('Route requires a same-origin local browser session', 403)
  }

  if (origin && !isLocalOrigin(origin)) {
    throw new LocalAccessError('Route requires a local browser origin', 403)
  }
}

function isLocalOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

export class LocalAccessError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
