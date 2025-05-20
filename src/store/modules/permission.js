// 权限控制模块
const state = {
  userRole: localStorage.getItem('userRole') || '',
  userId: '',
  permissionRules: {
    admin: {
      // 管理员拥有所有权限
      userManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all' // 可以查看所有用户
      },
      roleManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true
      },
      classManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all' // 可以查看所有班级
      },
      groupManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all' // 可以查看所有编组
      },
      courseManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all'
      },
      materialsManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        upload: true,
        title: '教学资料'
      },
      guidedTeaching: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all' // 可以查看所有课程
      },
      freeTraining: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'all' // 可以查看所有课程
      },
      scoreQuery: {
        view: true,
        review: true,
        dataScope: 'all' // 可以查看所有成绩
      },
      teacherReview: {
        view: true,
        add: true,
        edit: true,
        delete: true
      },
      statisticsAnalysis: {
        view: true,
        scoreDistribution: true,
        dataScope: 'all' // 可以查看所有统计数据
      }
    },
    teacher: {
      userManagement: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        dataScope: 'class' // 只能查看所教班级的学员
      },
      classManagement: {
        view: true,
        add: true,
        edit: true,
        delete: false,
        dataScope: 'own' // 只能查看自己管理的班级
      },
      groupManagement: {
        view: true,
        add: true,
        edit: true,
        delete: false,
        dataScope: 'own' // 只能查看自己管理的编组
      },
      courseManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'own' // 只能查看和管理自己创建的课程
      },
      materialsManagement: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        upload: true,
        title: '教学资料'
      },
      guidedTeaching: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'own' // 只能查看自己创建的课程
      },
      freeTraining: {
        view: true,
        add: true,
        edit: true,
        delete: true,
        dataScope: 'own' // 只能查看自己创建的课程
      },
      scoreQuery: {
        view: true,
        review: true,
        dataScope: 'class' // 只能查看所教班级的成绩
      },
      teacherReview: {
        view: true,
        add: true,
        edit: true,
        delete: true
      },
      statisticsAnalysis: {
        view: true,
        scoreDistribution: true,
        dataScope: 'class' // 只能查看所教班级的统计数据
      }
    },
    student: {
      userManagement: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        dataScope: 'self' // 只能查看自己的信息
      },
      materialsManagement: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        upload: false,
        title: '多媒体教学'
      },
      guidedTeaching: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        simulate: true,
        dataScope: 'assigned' // 只能查看分配给自己的课程
      },
      freeTraining: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        simulate: true,
        dataScope: 'assigned' // 只能查看分配给自己的课程
      },
      scoreQuery: {
        view: true,
        review: false,
        dataScope: 'self' // 只能查看自己的成绩
      },
      statisticsAnalysis: {
        view: true,
        scoreDistribution: false,
        dataScope: 'self' // 只能查看自己的统计数据
      }
    }
  }
}

const getters = {
  getPermissionRules: state => (role = state.userRole) => {
    console.log('获取权限规则:', { role, stateRole: state.userRole })
    return state.permissionRules[role] || {}
  },
  
  // 检查功能权限
  hasPermission: (state, getters) => (module, action) => {
    console.log('检查权限:', { 
      module, 
      action, 
      userRole: state.userRole,
      rules: getters.getPermissionRules(state.userRole)
    })
    const rules = getters.getPermissionRules(state.userRole)
    const hasPermission = rules[module] && rules[module][action]
    console.log('权限检查结果:', hasPermission)
    return hasPermission
  },
  
  // 获取数据权限范围
  getDataScope: (state, getters) => module => {
    const rules = getters.getPermissionRules(state.userRole)
    return rules[module] ? rules[module].dataScope : 'none'
  },
  
  // 获取模块标题（针对学员角色显示不同标题）
  getModuleTitle: (state, getters) => module => {
    const rules = getters.getPermissionRules(state.userRole)
    return rules[module] ? rules[module].title : ''
  }
}

const mutations = {
  SET_USER_ROLE(state, role) {
    console.log('设置用户角色:', role)
    state.userRole = role
    localStorage.setItem('userRole', role)
  },
  SET_USER_ID(state, id) {
    state.userId = id
  }
}

const actions = {
  // 初始化用户权限
  initializePermissions({ commit }, { role, userId }) {
    console.log('初始化权限:', { role, userId })
    if (!role) {
      console.error('初始化权限失败: 角色不能为空')
      throw new Error('角色不能为空')
    }
    commit('SET_USER_ROLE', role)
    commit('SET_USER_ID', userId)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 