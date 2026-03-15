<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Brush, Delete, EditPen, Plus, Promotion } from '@element-plus/icons-vue'
import MessageComp from './component/MessageComp.vue'
import { useChatStore } from '@/store/chatStore'

const chatStore = useChatStore()
const { sessionList, activeIndex, editIndex, queryKeys, loading, activeMessages } = storeToRefs(chatStore)

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

const filteredSessions = ref([
  {
    index: 0,
    item: {
      title: '默认会话1',
    },
  },
  {
    index: 1,
    item: {
      title: '默认会话2',
    },
  },
])

function handleClearStorage() {}

function handleAddSession() {}

function handleSessionTitleChange(index: number, title: string) {}

function handleClearSession(index: number) {}

function handleFocusIndex(index: number) {}

function handleDeleteSession(index: number) {}

function handleRequest() {}
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
            <MessageComp :messages="messages" :loading="loading" />
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
}

.add-btn {
  width: 100%;
  font-size: 15px;
  font-weight: bold;
}

.tips {
  width: 100%;
  height: 56px;
  background: linear-gradient(90deg, #3b82f6, #dbeafe);
  color: #ffffff;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: 0 14px;
  box-sizing: border-box;
}

.tips-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.tips .title {
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
}

.tips .desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 58vw;
}

.tips-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grid-box {
  display: grid;
  grid-template-columns: 280px auto;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.grid-space-between {
  width: 100%;
  height: calc(100% - 56px);
}

.left-container {
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.left-container .session-area {
  margin-top: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.left-container .session-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #374151;
  cursor: pointer;
  transition: all 0.3s ease;
}

.left-container .session-item-active {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.session-item .icon-box {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.session-item:hover .icon-box {
  opacity: 1;
}

.icon-box .icon {
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon:hover {
  transform: scale(1.2);
  color: #60a5fa !important;
}

:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

:deep(.el-button:active) {
  transform: translateY(1px);
}

:deep(.el-button.is-disabled) {
  background-color: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.3);
}

.right-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  padding: 16px 16px 10px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.right-container .message-area {
  width: calc(100% - 12px);
  flex: 1;
  min-height: 0;
  padding: 8px 8px 0 8px;
}

.input-area {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 0 8px 0 0;
  margin-top: 8px;
}

:deep(.el-input__wrapper) {
  height: 40px;
  line-height: 40px;
  background-color: #ffffff;
  border: 1px solid #d0d2d668;
  box-shadow: 0 0 8px rgba(156, 163, 175, 0.3);
  padding: 0 12px;
  transition: all 0.3s ease;
  color: #374151;
}

:deep(.el-input__wrapper .el-input__inner) {
  height: 40px;
  line-height: 40px;
  color: #374151;
  font-size: 14px;
}

.input-area :deep(.el-input) {
  flex: 1;
}

.action-btn {
  width: 96px;
  height: 40px;
  flex: 0 0 96px;
}
</style>
