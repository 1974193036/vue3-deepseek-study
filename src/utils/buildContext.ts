interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content?: string
  name?: string
}

const estimateTokens = (text: string) => Math.ceil((text || '').length / 4)

export function buildContext(messages: ChatMessage[], maxTokens = 6000, maxTurns = 14): ChatMessage[] {
  const systemMessages = messages.filter(m => m.role === 'system')
  const dialogMessages = messages.filter(m => m.role !== 'system')

  let tokenCount = systemMessages.reduce((acc, m) => acc + estimateTokens(m.content || ''), 0)
  const picked: ChatMessage[] = []

  for (let i = dialogMessages.length - 1; i >= 0; i--) {
    if (picked.length >= maxTurns)
      break
    const current = dialogMessages[i]
    if (!current)
      continue
    const cost = estimateTokens(current.content || '')
    if (tokenCount + cost > maxTokens)
      break
    picked.push(current)
    tokenCount += cost
  }

  return [...systemMessages, ...picked.reverse()].map(m => ({
    role: m.role,
    content: m.content,
    name: m.name,
  }))
}
