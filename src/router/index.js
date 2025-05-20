import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store' // 确保导入了vuex store

// 引入组件
import Layout from '../views/Layout.vue'
import LoginPage from '../views/LoginPage.vue'
import RoleManagement from '../views/RoleManagement.vue'
import UserManagement from '../views/UserManagement.vue'
import ClassManagement from '../views/ClassManagement.vue'
import GroupManagement from '../views/GroupManagement.vue'
import CourseManagement from '../views/CourseManagement.vue'
import MaterialsManagement from '../views/MaterialsManagement.vue'
import GuidedTeaching from '../views/GuidedTeaching.vue'
import FreeTraining from '../views/FreeTraining.vue'
import TrainingSimulator from '../views/TrainingSimulator.vue'
import ScoreQuery from '../views/ScoreQuery.vue'
import StatisticsAnalysis from '../views/StatisticsAnalysis.vue'

Vue.use(VueRouter)

// 定义角色权限映射
const rolePermissions = {
  admin: {
    allowedRoutes: ['StatisticsAnalysis', 'RoleManagement', 'UserManagement', 'ClassManagement', 'GroupManagement', 
                    'CourseManagement', 'MaterialsManagement', 'GuidedTeaching', 'FreeTraining', 'ScoreQuery'],
    defaultRoute: '/analysis'
  },
  teacher: {
    allowedRoutes: ['StatisticsAnalysis', 'UserManagement', 'ClassManagement', 'GroupManagement', 
                    'CourseManagement', 'MaterialsManagement', 'GuidedTeaching', 'FreeTraining', 'ScoreQuery'],
    defaultRoute: '/analysis'
  },
  student: {
    allowedRoutes: ['StatisticsAnalysis', 'UserManagement', 'MaterialsManagement', 'GuidedTeaching', 'FreeTraining', 'ScoreQuery'],
    defaultRoute: '/analysis'
  }
}

// 定义路由
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/',
    component: Layout,
    redirect: '/analysis',
    meta: { title: '首页' },
    children: [
      {
        path: '/analysis',
        name: 'StatisticsAnalysis',
        component: StatisticsAnalysis,
        meta: {
          requiresAuth: true,
          title: '统计分析'
        }
      },
      {
        path: '/roles',
        name: 'RoleManagement',
        component: () => import('@/views/RoleManagement.vue'),
        meta: {
          requiresAuth: true,
          title: '角色管理'
        }
      },
      {
        path: '/users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher', 'student'],
          title: '用户管理'
        }
      },
      {
        path: '/classes',
        name: 'ClassManagement',
        component: ClassManagement,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher'],
          title: '班级管理'
        }
      },
      {
        path: '/groups',
        name: 'GroupManagement',
        component: GroupManagement,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher'],
          title: '编组管理'
        }
      },
      {
        path: '/course-management',
        name: 'CourseManagement',
        component: CourseManagement,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher'],
          title: '教学课程'
        }
      },
      {
        path: '/materials',
        name: 'MaterialsManagement',
        component: MaterialsManagement,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher', 'student'],
          title: '教学资料'
        }
      },
      {
        path: '/guided-teaching',
        name: 'GuidedTeaching',
        component: GuidedTeaching,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher', 'student'],
          title: '引导教学'
        }
      },
      {
        path: '/free-training',
        name: 'FreeTraining',
        component: FreeTraining,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher', 'student'],
          title: '自由训练'
        }
      },
      {
        path: '/score-query',
        name: 'ScoreQuery',
        component: ScoreQuery,
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher', 'student'],
          title: '成绩查询'
        }
      },
      {
        path: '/teacher-review',
        name: 'TeacherReview',
        component: () => import('@/views/TeacherReview.vue'),
        meta: {
          requiresAuth: true,
          roles: ['admin', 'teacher'],
          title: '教师点评'
        }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: {
          requiresAuth: true,
          title: '个人中心'
        }
      }
    ]
  },
  {
    path: '/training-simulator',
    name: 'TrainingSimulator',
    component: TrainingSimulator,
    meta: {
      requiresAuth: true,
      roles: ['student'],
      title: '仿真练习'
    }
  }
]

// 创建路由实例
const router = new VueRouter({
  routes
})

// 全局导航守卫
router.beforeEach(async (to, from, next) => {
  try {
    console.log('==== 路由导航开始 ====')
    console.log('从:', from.path)
    console.log('到:', to.path)
    
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const userRole = localStorage.getItem('userRole')
    
    console.log('认证状态:', { isAuthenticated, userRole })

    // 如果是登录页面
    if (to.path === '/login') {
      if (isAuthenticated) {
        next('/analysis')
      } else {
        next()
      }
      return
    }

    // 如果未登录，重定向到登录页面
    if (!isAuthenticated) {
      next('/login')
      return
    }

    // 确保权限已初始化
    if (userRole && (!store.state.permission || !store.state.permission.userRole)) {
      try {
        await store.dispatch('permission/initializePermissions', {
          role: userRole,
          userId: store.state.user.userInfo?.id
        })
      } catch (error) {
        console.error('初始化权限失败:', error)
        next('/login')
        return
      }
    }

    // 检查路由是否需要认证
    if (to.meta.requiresAuth) {
      // 检查角色权限
      if (to.meta.roles && !to.meta.roles.includes(userRole)) {
        console.log('无权限访问该页面')
        next('/analysis')
        return
      }
    }

    next()
  } catch (error) {
    console.error('路由导航错误:', error)
    // 清除认证状态并重定向到登录页
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    next('/login')
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router 