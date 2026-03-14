<script setup lang="ts">
import { ref } from 'vue'
import MessageComp from './component/MessageComp.vue'

const messages = ref([
  {
    role: 'user' as const,
    content: '这里是内容111',
  },
  {
    role: 'assistant' as const,
    content: '这里是内容222',
  },
])

const loading = ref(false)
</script>

<template>
  <div class="html-container">
    <div class="page">
      <MessageComp :messages="messages" :loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.html-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
}

.page {
  width: 94vw;
  height: 94vh;
  background: #ffffff;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
  box-sizing: border-box;
  border-radius: 12px;
  overflow: hidden;
  padding: 16px 16px 10px 16px;
}
</style>
