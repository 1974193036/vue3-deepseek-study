export type LlmErrorType
  = | 'auth'
    | 'rate_limit'
    | 'server'
    | 'network'
    | 'abort'
    | 'bad_request'
    | 'unknown'

export interface LlmAppError extends Error {
  type: LlmErrorType
  status?: number
  original?: unknown
}

interface StreamRequest {
  messages: any[]
  model?: string
}

function toAppError(raw: any): LlmAppError {
  const err = new Error(raw?.message || 'Unknown error') as LlmAppError
  err.original = raw

  if (raw?.name === 'AbortError') {
    err.type = 'abort'
    return err
  }

  const status = raw?.status ?? raw?.response?.status
  err.status = status

  if (status === 400)
    err.type = 'bad_request'
  else if (status === 401 || status === 403)
    err.type = 'auth'
  else if (status === 429)
    err.type = 'rate_limit'
  else if (status >= 500)
    err.type = 'server'
  else if (!status)
    err.type = 'network'
  else err.type = 'unknown'

  return err
}

function shouldRetry(err: LlmAppError): boolean {
  if (err.type === 'abort' || err.type === 'auth' || err.type === 'bad_request') {
    return false
  }
  return true
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function streamChatOnce(params: {
  request: StreamRequest
  signal: AbortSignal
  onDelta: (text: string) => void
}) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params.request),
    signal: params.signal,
  })

  if (!response.ok) {
    let payload: any = null
    try {
      payload = await response.json()
    }
    catch {
      payload = null
    }

    const err = new Error(payload?.message || `Request failed: ${response.status}`) as LlmAppError
    err.status = response.status
    throw toAppError(err)
  }

  if (!response.body) {
    throw toAppError(new Error('Empty response body'))
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break

    buffer += decoder.decode(value, { stream: true })
    let idx = buffer.indexOf('\n\n')

    while (idx !== -1) {
      const eventChunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)

      const lines = eventChunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:'))
          continue
        const jsonText = line.slice(5).trim()
        if (!jsonText)
          continue

        let event: any
        try {
          event = JSON.parse(jsonText)
        }
        catch {
          continue
        }

        if (event.type === 'delta' && event.text) {
          params.onDelta(event.text)
        }

        if (event.type === 'error') {
          const err = new Error(event.message || 'Stream error') as LlmAppError
          err.status = event.status
          throw toAppError(err)
        }
      }

      idx = buffer.indexOf('\n\n')
    }
  }
}

export async function streamChatWithRetry(params: {
  messages: any[]
  signal: AbortSignal
  onDelta: (text: string) => void
  model?: string
  retries?: number
  retryBaseMs?: number
}) {
  const retries = params.retries ?? 3
  const retryBaseMs = params.retryBaseMs ?? 600

  for (let attempt = 0; attempt < retries; attempt++) {
    let emitted = false

    try {
      await streamChatOnce({
        request: {
          messages: params.messages,
          model: params.model,
        },
        signal: params.signal,
        onDelta: (text: string) => {
          emitted = true
          params.onDelta(text)
        },
      })
      return
    }
    catch (raw) {
      const err = toAppError(raw)
      if (emitted || !shouldRetry(err) || attempt === retries - 1) {
        throw err
      }

      const backoff = retryBaseMs * 2 ** attempt // 600 * 1, 600 * 2
      const jitter = Math.floor(Math.random() * 200)
      await sleep(backoff + jitter)
    }
  }
}
