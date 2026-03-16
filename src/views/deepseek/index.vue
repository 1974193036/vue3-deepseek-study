<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Brush, Delete, EditPen, Plus, Promotion } from '@element-plus/icons-vue'
import MessageComp from './component/MessageComp.vue'
import { useChatStore } from '@/store/chatStore'

const chatStore = useChatStore()
const { sessionList, activeIndex, editIndex, queryKeys, loading, activeMessages } = storeToRefs(chatStore)

const messageRef = ref<InstanceType<typeof MessageComp> | null>(null)

const filteredSessions = computed(() => sessionList.value.map((item, index) => ({ item, index })))

// 新建会话
function handleAddSession() {
  chatStore.addSession()
}

// 更改会话标题
function handleSessionTitleChange(index: number, title: string) {
  chatStore.updateSessionTitle(index, title)
  chatStore.setEditIndex(-1)
}

// 清屏当前会话
function handleClearSession(index: number) {
  chatStore.clearSession(index)
}

// 重命名会话标题
function handleFocusIndex(index: number) {
  chatStore.setEditIndex(index)
}

// 删除会话
function handleDeleteSession(index: number) {
  ElMessageBox.confirm('确定删除该会话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      chatStore.deleteSession(index)
      await nextTick()
      messageRef.value?.scrollToBottom()
    })
}

// 选中当前会话
async function handleChangeSessionIndex(index: number) {
  chatStore.changeSession(index)
  await nextTick()
  messageRef.value?.scrollToBottom()
}

// 清空所有数据
function handleClearStorage() {
  ElMessageBox.confirm('是否清空本地数据？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    chatStore.clearAll()
  })
}

// 发送对话
async function handleRequest() {
  const text = queryKeys.value.trim()
  if (!text) {
    ElMessage.error('请输入问题后再发送')
    return
  }

  chatStore.ensureSession()

  const sessionIndex = activeIndex.value
  const currentSession = chatStore.sessionList[sessionIndex]
  const isFirstMessage = !!currentSession && currentSession.messages.length === 0
  if (isFirstMessage) {
    // eslint-disable-next-line e18e/prefer-static-regex
    const rawTitle = text.replace(/\s+/g, ' ').trim()
    const title = rawTitle.length > 16 ? `${rawTitle.slice(0, 16)}...` : rawTitle
    if (title) {
      chatStore.updateSessionTitle(sessionIndex, title)
    }
  }

  chatStore.appendMessage(
    {
      role: 'user',
      content: text,
      name: '问答助手',
      status: 'done',
    },
    false,
    sessionIndex,
  )

  queryKeys.value = ''

  chatStore.appendMessage(
    {
      role: 'assistant',
      content: '',
      status: 'streaming',
    },
    false,
    sessionIndex,
  )

  loading.value = true

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: text }],
      }),
    });
    const reader = res.body?.getReader(); // 先创建一个 reader 对象
    // 创建一个解码器
    const decoder = new TextDecoder("utf-8");
    while(true){
      const {done, value} = await reader!.read();
      if(done) break;

      const chunk = decoder.decode(value, { stream: true});
      const lines = chunk.split("\n\n").filter(line=>line.trim());
      for(const line of lines){
        try{
          const data = JSON.parse(line.replace('data: ', '')); // data = {"response":"你好"}
          console.log(data)
        }catch(e){
          console.error("JSON解析失败☹️", e);
        }
      }
    }
  } catch(e) {

  } finally {
    loading.value = false
  }
}

onMounted(() => {
  chatStore.initFromStorage()
})
</script>

<template>
  <div class="html-container">
    <div class="page">
      <div class="tips">
        <div class="tips-left">
          <div class="title">
            Vue3 + DeepSeek 从 0 到 1 实现 AI 问答助手
          </div>
          <div class="desc">
            本网站采用本地缓存模式运行，不会保留任何涉及您个人的信息数据，请放心使用。
          </div>
        </div>
        <div class="tips-right">
          <el-button size="small" @click="handleClearStorage">
            清空
          </el-button>
        </div>
      </div>
      <div class="grid-space-between grid-box">
        <div class="left-container">
          <el-button class="add-btn" type="primary" :icon="Plus" size="large" @click="handleAddSession">
            新建对话
          </el-button>
          <div class="session-area">
            <div
              v-for="row in filteredSessions"
              :key="`session_${row.index}`"
              class="session-item"
              :class="activeIndex === row.index ? 'session-item-active' : ''"
              @click="handleChangeSessionIndex(row.index)"
            >
              <span v-if="editIndex !== row.index">{{ row.item.title }}</span>
              <el-input
                v-else
                v-model="row.item.title"
                size="small"
                autofocus
                @change="handleSessionTitleChange(row.index, row.item.title)"
                @blur="handleSessionTitleChange(row.index, row.item.title)"
              />
              <div class="icon-box">
                <el-tooltip content="清屏" placement="top" :show-after="120">
                  <el-icon class="icon" color="#3b82f6" @click.stop="handleClearSession(row.index)">
                    <Brush />
                  </el-icon>
                </el-tooltip>
                <el-tooltip content="重命名" placement="top" :show-after="120">
                  <el-icon class="icon" color="#3b82f6" @click.stop="handleFocusIndex(row.index)">
                    <EditPen />
                  </el-icon>
                </el-tooltip>
                <el-tooltip content="删除" placement="top" :show-after="120">
                  <el-icon class="icon" color="#3b82f6" @click.stop="handleDeleteSession(row.index)">
                    <Delete />
                  </el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
        <div class="right-container">
          <div class="message-area">
            <MessageComp ref="messageRef" :messages="activeMessages" :loading="loading" />
          </div>
          <div class="input-area">
            <el-input id="keyInput" v-model="queryKeys" placeholder="请输入内容" show-word-limit @keyup.enter="handleRequest" />
            <el-button class="action-btn" :loading="loading" type="primary" :disabled="!queryKeys" @click="handleRequest">
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './index.css';
</style>
