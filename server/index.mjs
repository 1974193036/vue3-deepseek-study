import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

// 将正则表达式移到模块作用域
const LINE_BREAK_REGEX = /\r?\n/

function loadEnvFile(filename) {
  const fullPath = path.resolve(process.cwd(), filename)
  if (!fs.existsSync(fullPath))
    return

  const lines = fs.readFileSync(fullPath, 'utf8').split(LINE_BREAK_REGEX)
  for (const line of lines) {
    if (!line || line.startsWith('#'))
      continue
    const eqIdx = line.indexOf('=')
    if (eqIdx <= 0)
      continue
    const key = line.slice(0, eqIdx).trim()
    const value = line.slice(eqIdx + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env')
loadEnvFile('.env.server')

const PORT = Number(process.env.PORT || 3001)
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || ''

const client = new OpenAI({
  baseURL: OPENAI_BASE_URL,
  apiKey: OPENAI_API_KEY,
})

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1024 * 1024) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      }
      catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(payload))
}

function sendSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

const server = http.createServer(async (req, res) => {
  // console.log('request', req.method, req.url)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/api/chat/stream') {
    sendJson(res, 404, { message: 'Not found' })
    return
  }

  if (!OPENAI_BASE_URL || !OPENAI_API_KEY) {
    sendJson(res, 500, { message: 'Server missing OPENAI_API_KEY' })
    return
  }

  let body
  try {
    body = await parseBody(req)
  }
  catch (err) {
    sendJson(res, 400, { message: err.message || 'Bad request' })
    return
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    sendJson(res, 400, { message: 'messages must be a non-empty array' })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const abortController = new AbortController()
  req.on('close', () => {
    abortController.abort()
  })

  try {
    const stream = await client.chat.completions.create(
      {
        model: body.model || OPENAI_MODEL,
        stream: true,
        messages: body.messages,
      },
      { signal: abortController.signal },
    )

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta
      const text = `${delta?.reasoning_content || ''}${delta?.content || ''}`
      if (text) {
        sendSse(res, { type: 'delta', text })
      }
    }

    sendSse(res, { type: 'done' })
    res.end()
  }
  catch (err) {
    const status = err?.status || err?.response?.status || 500
    const message = err?.message || 'Upstream request failed'
    sendSse(res, { type: 'error', status, message })
    res.end()
  }
})

server.listen(PORT, () => {
  console.log(`[chat-server] listening on http://127.0.0.1:${PORT}`)
})
