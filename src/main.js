import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import permission from './directives/permission'
import api from './api'

// 引入Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// 使用Element UI
Vue.use(ElementUI)

// 注册API
Vue.prototype.$api = api

Vue.config.productionTip = false

// 添加全局错误处理
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue错误:', err)
  console.info('错误组件:', vm)
  console.info('错误信息:', info)
}

// 注册权限指令
Vue.directive('permission', permission)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app') 