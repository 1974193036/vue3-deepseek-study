import { defineStore } from 'pinia'
import { STORAGE_KEY } from '@/config/deepseek'

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

let persistTimer: ReturnType<typeof setTimeout> | null = null
const createMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

function normalizeMessage(msg: any): ChatMessage {
  return {
    id: msg?.id || createMessageId(),
    role: msg?.role || 'user',
    content: msg?.content || '',
    name: msg?.name,
    status: msg?.status || 'done',
    errorMessage: msg?.errorMessage,
  }
}

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
  actions: {
    initFromStorage() {
      const rawList = JSON.parse(localStorage.getItem(STORAGE_KEY.sessionList) || '[]') as SessionItem[]
      this.sessionList = rawList.map(session => ({
        ...session,
        messages: Array.isArray(session?.messages) ? session.messages.map(normalizeMessage) : [],
      }))
      const lastIndex = JSON.parse(localStorage.getItem(STORAGE_KEY.activeIndex) || '-1')
      this.activeIndex = this.sessionList.length > 0 ? lastIndex : -1
    },
    persistNow() {
      localStorage.setItem(STORAGE_KEY.sessionList, JSON.stringify(this.sessionList))
      localStorage.setItem(STORAGE_KEY.activeIndex, JSON.stringify(this.activeIndex))
    },
    schedulePersist(delay = 300) {
      if (persistTimer) {
        clearTimeout(persistTimer)
      }
      persistTimer = setTimeout(() => {
        this.persistNow()
        persistTimer = null
      }, delay)
    },
    addSession() {
      this.sessionList.push({
        title: `对话${this.sessionList.length + 1}`,
        crtTime: new Date().toISOString(),
        messages: [],
      })
      this.activeIndex = this.sessionList.length - 1
      this.schedulePersist()
    },
    changeSession(index: number) {
      this.activeIndex = index
      this.schedulePersist()
    },
    setEditIndex(index: number) {
      this.editIndex = index
    },
    updateSessionTitle(index: number, title: string) {
      if (!this.sessionList[index])
        return
      this.sessionList[index].title = title
      this.schedulePersist()
    },
    clearSession(index: number) {
      if (!this.sessionList[index])
        return
      this.sessionList[index].messages = []
      this.activeIndex = index
      this.schedulePersist()
    },
    deleteSession(index: number) {
      this.sessionList.splice(index, 1)
      if (this.activeIndex === index) {
        this.activeIndex = this.sessionList[index] ? index : index - 1
      }
      else if (this.activeIndex > index) {
        this.activeIndex -= 1
      }
      this.schedulePersist()
    },
    clearAll() {
      this.sessionList = []
      this.activeIndex = -1
      this.editIndex = -1
      this.queryKeys = ''
      this.loading = false
      localStorage.clear()
    },
    ensureSession() {
      if (!this.sessionList.length) {
        this.addSession()
      }
    },
    appendMessage(message: ChatMessage, persist = true, sessionIndex?: number) {
      this.ensureSession()
      const targetIndex = typeof sessionIndex === 'number' && sessionIndex > -1 ? sessionIndex : this.activeIndex
      const session = this.sessionList[targetIndex]
      if (!session)
        return
      session.messages.push({
        ...normalizeMessage(message),
      })
      if (persist)
        this.schedulePersist()
    },
  },
})
