<template>
  <div class="login-container">
    <div class="login-box">
      <h2>军方仿真训练管理系统</h2>
      <div class="login-form">
        <div class="form-item">
          <input 
            type="text" 
            v-model="username" 
            placeholder="用户名"
            @keyup.enter="handleLogin"
          >
        </div>
        <div class="form-item">
            <input 
            type="password" 
              v-model="password" 
            placeholder="密码"
              @keyup.enter="handleLogin"
            >
        </div>
        <div class="form-options">
          <label class="remember-password">
            <input 
              type="checkbox" 
              v-model="rememberPassword"
            > 记住密码
          </label>
          <a class="forget-password" @click="showForgetPasswordTip">忘记密码？</a>
        </div>
        <button class="login-button" @click="handleLogin">登录</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      rememberPassword: false
    }
  },
  methods: {
    ...mapActions({
      loginUser: 'user/loginUser',
      initializePermissions: 'permission/initializePermissions'
    }),
    async handleLogin() {
      if (!this.username || !this.password) {
        this.$message.error('请输入用户名和密码')
        return
      }

      try {
        // 调用登录接口
        const response = await this.loginUser({
          username: this.username,
          password: this.password
        })

        // 初始化用户权限
        await this.initializePermissions({
          role: response.data.userInfo.role,
          userId: response.data.userInfo.id
        })

        // 如果选择记住密码，保存账号密码
        if (this.rememberPassword) {
          localStorage.setItem('savedUsername', this.username)
          localStorage.setItem('savedPassword', btoa(this.password)) // 使用base64简单加密
        } else {
          // 如果取消记住密码，清除保存的账号密码
          localStorage.removeItem('savedUsername')
          localStorage.removeItem('savedPassword')
        }

        // 设置认证状态
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', response.data.userInfo.role)
        
        // 跳转到首页
        this.$router.push('/analysis')
      } catch (error) {
        console.error('登录错误:', error)
        this.$message.error('登录失败，请稍后重试')
      }
    },
    showForgetPasswordTip() {
      this.$message.info('请联系管理员获取账号密码')
    }
  },
  created() {
    // 如果已经登录，直接跳转到首页
    if (localStorage.getItem('isAuthenticated')) {
      const userRole = localStorage.getItem('userRole') || 'student'
      this.$store.dispatch('permission/initializePermissions', {
        role: userRole,
        userId: this.$store.state.user.userInfo?.userId
      })
      this.$router.push('/analysis')
    } else {
      // 如果有保存的账号密码，自动填充
      const savedUsername = localStorage.getItem('savedUsername')
      const savedPassword = localStorage.getItem('savedPassword')
      if (savedUsername && savedPassword) {
        this.username = savedUsername
        this.password = atob(savedPassword) // 解密密码
        this.rememberPassword = true
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #0C2D48;
  margin-bottom: 30px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  position: relative;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.remember-password {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
}

.remember-password input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.forget-password {
  color: #1890ff;
  cursor: pointer;
  text-decoration: none;
}

.forget-password:hover {
  color: #40a9ff;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: #0C2D48;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.login-button:hover {
  background-color: #1890ff;
}
</style> 