// 导出routes
const routes = [
  {
    path: '/',  // 访问根路径
    name: 'deepseek',  // 路由名称，用于跳转
    component: () => import('@/views/deepseek/index.vue') // 加载的页面
  }
]

export default routes
