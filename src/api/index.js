// 模拟API响应延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API服务
const api = {
  // 登录
  async login({ username, password }) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟不同角色的登录判断
    let userInfo = null
    let token = null

    if (username === 'admin' && password === '123456') {
      userInfo = {
        id: 1,
        username: 'admin',
        name: '系统管理员',
        role: 'admin',
        avatar: ''
      }
      token = 'admin_token'
    } else if (username.startsWith('teacher') && password === '123456') {
      userInfo = {
        id: 2,
        username,
        name: '教师' + username.substring(7),
        role: 'teacher',
        avatar: ''
      }
      token = 'teacher_token'
    } else if (username.startsWith('student') && password === '123456') {
      userInfo = {
        id: 3,
        username,
        name: '学员' + username.substring(7),
        role: 'student',
        avatar: ''
      }
      token = 'student_token'
    } else {
      throw new Error('用户名或密码错误')
    }

    return {
      data: {
        token,
        userInfo
      }
    }
  },

  // 获取用户信息
  async getUserInfo() {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const token = localStorage.getItem('token')
    const role = token?.split('_')[0]
    
    if (!token || !role) {
      throw new Error('未登录或登录已过期')
    }

    let userInfo = {
      id: 1,
      username: 'unknown',
      name: '未知用户',
      role: role,
      avatar: ''
    }

    switch (role) {
      case 'admin':
        userInfo = {
          id: 1,
          username: 'admin',
          name: '系统管理员',
          role: 'admin',
          avatar: ''
        }
        break
      case 'teacher':
        userInfo = {
          id: 2,
          username: 'teacher1',
          name: '教师1',
          role: 'teacher',
          avatar: ''
        }
        break
      case 'student':
        userInfo = {
          id: 3,
          username: 'student1',
          name: '学员1',
          role: 'student',
          avatar: ''
        }
        break
    }

    return {
      data: userInfo
    }
  },

  // 退出登录
  async logout() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: { success: true } }
  }
}

export default api 