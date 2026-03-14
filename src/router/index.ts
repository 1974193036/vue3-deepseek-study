import { createRouter, createWebHistory } from 'vue-router'
// 导入路由配置文件
import routes from './routes'

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 的 History 模式
  history: createWebHistory(),
  // 路由配置
  routes,
  // 滚动行为 - 始终滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  }
})

// 全局前置守卫(这里可以做权限校验，比如登录判断)
router.beforeEach((_to: any, _from: any) => {
  // console.log('全局前置守卫', to, from)
  return true
})

// 全局后置守卫(这里可以加入改变页面标题等操作)
router.afterEach((to: any, _from: any) => {
  // console.log('全局后置守卫', to, from)
  const _title = to.meta.title
  if (_title) {
    window.document.title = _title
  } else {
    window.document.title = '基于Vue3+DeepSeek开发AI问答助手'
  }
})
export default router