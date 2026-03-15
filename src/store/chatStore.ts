import { defineStore } from 'pinia'

export interface ChatMessage {
  id?: string
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
  status?: 'sending' | 'streaming' | 'done' | 'error'
  errorMessage?: string
}

export interface SessionItem {
  title: string
  crtTime: string
  messages: ChatMessage[]
}

// let persistTimer: ReturnType<typeof setTimeout> | null = null
// const createMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// function normalizeMessage(msg: any): ChatMessage {
//   return {
//     id: msg?.id || createMessageId(),
//     role: msg?.role || 'user',
//     content: msg?.content || '',
//     name: msg?.name,
//     status: msg?.status || 'done',
//     errorMessage: msg?.errorMessage,
//   }
// }

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessionList: [] as SessionItem[],
    activeIndex: -1,
    editIndex: -1,
    queryKeys: '',
    loading: false,
  }),
  getters: {
    activeMessages(state): ChatMessage[] {
      return state.activeIndex > -1 ? (state.sessionList[state.activeIndex]?.messages ?? []) : []
    },
  },
})
