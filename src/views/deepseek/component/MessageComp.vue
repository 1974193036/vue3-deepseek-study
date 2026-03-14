<script setup lang="ts">
import { nextTick, watch } from 'vue'

interface ChatMessage {
  role: 'assistant' | 'user' | 'system'
  content?: string
  status?: 'sending' | 'streaming' | 'done' | 'error'
}

const props = withDefaults(
  defineProps<{
    messages?: ChatMessage[]
  }>(),
  {
    messages: () => [],
  },
)

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
              <div>这里渲染markdown的内容</div>
              <div v-if="item.role === 'assistant'">
                这里展示加载中...
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
