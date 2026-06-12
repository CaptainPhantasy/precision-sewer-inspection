import { NextRequest, NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'

/**
 * Secure server-side proxy for Google Cloud Translation (v3 REST).
 *
 * The Google credential never reaches the client. This route reuses the
 * project's existing service-account env vars (the same pair used for Google
 * Calendar) and mints a short-lived access token scoped to cloud-translation.
 *
 * Graceful degradation: if translation is not configured/enabled or the API
 * errors, we return the original text with `configured: false`. The client
 * LocaleEngine then falls back to its seed dictionary / English, so the page
 * never breaks because of a translation outage.
 */
export const dynamic = 'force-dynamic'

const SUPPORTED_TARGETS = new Set(['en', 'es'])
const MAX_TEXT_LENGTH = 5000

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
const SERVICE_ACCOUNT_PRIVATE_KEY = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n')

/** Process-lifetime cache (per serverless instance) keyed by `${target}:${text}`. */
const cache = new Map<string, string>()
const CACHE_MAX = 1000

function getProjectId(): string {
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) return process.env.GOOGLE_CLOUD_PROJECT_ID
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT
  // Derive from `name@PROJECT_ID.iam.gserviceaccount.com`.
  const match = SERVICE_ACCOUNT_EMAIL.match(/@([^.]+)\.iam\.gserviceaccount\.com$/)
  return match?.[1] || ''
}

function isConfigured(): boolean {
  return Boolean(SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY && getProjectId())
}

let cachedClient: JWT | null = null
function getAuthClient(): JWT {
  if (!cachedClient) {
    cachedClient = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/cloud-translation'],
    })
  }
  return cachedClient
}

function rememberInCache(key: string, value: string): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, value)
}

export async function POST(request: NextRequest) {
  let text = ''
  let target = ''
  let source = 'en'
  try {
    const body = await request.json()
    text = typeof body?.text === 'string' ? body.text : ''
    target = typeof body?.target === 'string' ? body.target : ''
    source = typeof body?.source === 'string' ? body.source : 'en'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  text = text.trim()
  if (!text) {
    return NextResponse.json({ error: 'Missing "text"' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Text too long' }, { status: 413 })
  }
  if (!SUPPORTED_TARGETS.has(target)) {
    return NextResponse.json({ error: 'Unsupported "target"' }, { status: 400 })
  }

  // Nothing to do if source and target match.
  if (target === source) {
    return NextResponse.json({ translatedText: text, configured: isConfigured(), cached: false })
  }

  const cacheKey = `${target}:${text}`
  const hit = cache.get(cacheKey)
  if (hit !== undefined) {
    return NextResponse.json({ translatedText: hit, configured: true, cached: true })
  }

  // Not configured → graceful fallback (return source text).
  if (!isConfigured()) {
    return NextResponse.json({ translatedText: text, configured: false, cached: false })
  }

  try {
    const projectId = getProjectId()
    const { token } = await getAuthClient().getAccessToken()
    if (!token) {
      return NextResponse.json({ translatedText: text, configured: false, cached: false })
    }

    const endpoint = `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: source,
        targetLanguageCode: target,
      }),
    })

    if (!res.ok) {
      // API disabled, missing role, quota, etc. — degrade gracefully but log
      // the exact Google error so operators can act on it.
      const errBody = await res.text().catch(() => '')
      console.error('[translate] Google Translation API error', res.status, errBody)
      return NextResponse.json({ translatedText: text, configured: true, cached: false, degraded: true })
    }

    const data = (await res.json()) as {
      translations?: Array<{ translatedText?: string }>
    }
    const translatedText = data.translations?.[0]?.translatedText?.trim() || text
    rememberInCache(cacheKey, translatedText)

    return NextResponse.json({ translatedText, configured: true, cached: false })
  } catch (err) {
    // Network / auth failure — never surface an error to the client UI.
    console.error('[translate] request failed', err)
    return NextResponse.json({ translatedText: text, configured: true, cached: false, degraded: true })
  }
}
