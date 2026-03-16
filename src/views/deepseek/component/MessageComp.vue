<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import type { ChatMessage } from '@/store/chatStore'
import MarkdownItHighlightjs from 'markdown-it-highlightjs'

const props = withDefaults(
  defineProps<{
    messages?: ChatMessage[]
  }>(),
  {
    messages: () => [],
  },
)

const emit = defineEmits<{
  retry: [index: number]
}>()

async function scrollToBottom() {
  await nextTick()

  const messageCompBoxDiv = document.getElementById('messageCompBox')
  if (messageCompBoxDiv) {
    messageCompBoxDiv.scrollTop = messageCompBoxDiv.scrollHeight - messageCompBoxDiv.clientHeight
  }
}

defineExpose({
  scrollToBottom,
})

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
}).use(MarkdownItHighlightjs)

const renderMarkdown = (text: string) => DOMPurify.sanitize(md.render(text || ''))
</script>

<template>
  <template v-if="messages.length > 0">
    <div id="messageCompBox" class="container-message">
      <div v-for="(item, index) in messages" :key="`message_${index}`" class="box-item">
        <div
          v-if="item.role === 'assistant' || item.content"
          class="message-item" :class="[item.role === 'assistant' ? 'message-item-assistant' : 'message-item-user']"
        >
          <el-avatar v-if="item.role === 'assistant'" class="message-item-avatar">
            <img src="../images/ai.png">
          </el-avatar>
          <!-- 占位配合grid布局 -->
          <div v-else />

          <div class="message-item-content" :class="[item.role === 'assistant' ? 'message-item-content-left' : 'message-item-content-right']">
            <div class="message-item-text">
              <div v-html="renderMarkdown(item.content || '')" />
              <div v-if="item.role === 'assistant' && item.status" class="status-row">
                <div v-if="item.status === 'streaming' && !item.content" class="thinking-indicator">
                  <span class="thinking-text">思考中</span>
                  <span class="dot" />
                  <span class="dot" />
                  <span class="dot" />
                </div>
                <span v-else-if="item.status === 'error'" class="status-tag status-error">生成失败</span>
                <el-button
                  v-if="item.status === 'error'"
                  class="retry-btn"
                  text
                  size="small"
                  @click="emit('retry', index)"
                >
                  <el-icon><RefreshRight /></el-icon>
                  重试
                </el-button>
              </div>
            </div>
          </div>

          <el-avatar v-if="item.role === 'user'" class="message-item-avatar">
            <img src="../images/user.png">
          </el-avatar>
          <!-- 占位配合grid布局 -->
          <div v-else />
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="empty-box">
      <el-empty description="暂无对话消息" />
    </div>
  </template>
</template>

<style scoped>
@import './MessageComp.css';
</style>
