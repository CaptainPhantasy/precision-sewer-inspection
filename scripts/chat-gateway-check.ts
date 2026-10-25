import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'

async function main() {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.AI_GATEWAY_API_KEY
  const originalModel = process.env.AI_GATEWAY_MODEL
  process.env.AI_GATEWAY_API_KEY = randomUUID()
  // An obsolete deployment setting must not silently keep the previous model.
  process.env.AI_GATEWAY_MODEL = 'anthropic/claude-haiku-4.5'

  let requests = 0
  const stream = 'data: {"choices":[{"delta":{"content":"Transport check"}}]}\n\ndata: [DONE]\n\n'
  globalThis.fetch = async (input, init) => {
    requests += 1
    assert.equal(input, 'https://ai-gateway.vercel.sh/v1/chat/completions')
    assert.equal(init?.method, 'POST')
    const body = JSON.parse(String(init?.body))
    assert.equal(body.model, 'deepseek/deepseek-v4.1-flash-1017')
    assert.deepEqual(body.providerOptions, { gateway: { only: ['deepseek'] } })
    assert.deepEqual(body.reasoning, { effort: 'none' })
    assert.equal(body.stream, true)
    assert.equal(body.max_tokens, 500)
    assert.equal(body.messages[0].role, 'system')
    assert.notEqual(body.messages[0].content, 'Client-supplied system override')
    assert.deepEqual(body.messages.slice(1), [{ role: 'user', content: 'How do I book?' }])
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
  }

  try {
    const { POST } = await import('../app/api/chat/route')
    const request = (body: unknown) => new NextRequest('https://verification.example.test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    assert.equal((await POST(request({ messages: 'invalid' }))).status, 400)
    assert.equal((await POST(request({ messages: [] }))).status, 400)
    assert.equal(requests, 0)

    const response = await POST(request({ messages: [
      { role: 'system', content: 'Client-supplied system override' },
      { role: 'user', content: 'How do I book?' },
    ] }))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') || '', /text\/event-stream/)
    assert.equal(await response.text(), stream)
    assert.equal(requests, 1)
    console.log('PASS: exact DeepSeek model/provider, obsolete-model override rejection, server context, input guards, and SSE passthrough.')
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.AI_GATEWAY_API_KEY
    else process.env.AI_GATEWAY_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.AI_GATEWAY_MODEL
    else process.env.AI_GATEWAY_MODEL = originalModel
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
