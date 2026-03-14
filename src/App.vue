<script setup lang="ts">

</script>

<template>
  <router-view></router-view>
</template>

<style>
::-webkit-scrollbar {
  /**滚动条宽度*/
  width: 7px;
  /**隐藏滚动条*/
  display: none;
}

::-webkit-scrollbar-thumb {
  /**滚动条滑块的圆角*/
  border-radius: 8px;
  /**滚动条滑块的背景颜色*/
  background-color: #3b82f6;
  /**隐藏滚动条 */
  display: none;
}

::-webkit-scrollbar-track {
  /**滚动条轨道的圆角 */
  border-radius: 8px;
  /**滚动条轨道的背景颜色*/
  background-color: rgba(59, 130, 246, 0.5);
  /**隐藏滚动条 */
  display: none;
  /**滚动条轨道的边框 蓝色实线 */
  border: 1px solid rgba(59, 130, 246, 0.5);
}

body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Arial, Helvetica, sans-serif;
  width: 100vw;
  height: 100vh;
}
</style>
