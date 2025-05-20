<template>
  <div class="login-container">
    <!-- 左侧品牌区域 -->
    <div class="brand-area">
      <div class="brand-content">
        <h1 class="system-name">军方仿真训练管理系统</h1>
        <p class="system-desc">高效管理训练任务 · 精准分析训练数据</p>
      </div>
    </div>

    <!-- 右侧登录表单区域 -->
    <div class="login-form-area">
      <div class="login-form-container">
        <h2 class="login-title">系统登录</h2>
        
        <form class="login-form" @submit.prevent="handleLogin">
          <!-- 用户类型选择 -->
          <div class="form-item">
            <label>用户类型</label>
            <select v-model="loginForm.userType" class="input-control">
              <option value="admin">管理员</option>
              <option value="teacher">教师</option>
              <option value="student">学员</option>
            </select>
          </div>
          
          <!-- 账号输入 -->
          <div class="form-item">
            <label>账号</label>
            <input 
              type="text" 
              v-model="loginForm.username" 
              class="input-control"
              :class="{'input-error': errors.username}"
              placeholder="请输入账号"
              @blur="validateUsername"
            />
            <div class="error-msg" v-if="errors.username">{{ errors.username }}</div>
          </div>
          
          <!-- 密码输入 -->
          <div class="form-item">
            <label>密码</label>
            <div class="password-input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="loginForm.password" 
                class="input-control"
                :class="{'input-error': errors.password}"
                placeholder="请输入密码"
                @blur="validatePassword"
              />
              <span 
                class="password-toggle" 
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '隐藏' : '显示' }}
              </span>
            </div>
            <div class="error-msg" v-if="errors.password">{{ errors.password }}</div>
          </div>
          
          <!-- 记住密码 -->
          <div class="form-item remember-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="loginForm.remember" />
              <span>记住密码</span>
            </label>
            <a href="#" class="forgot-password">忘记密码?</a>
          </div>
          
          <!-- 登录按钮 -->
          <div class="form-item">
            <button 
              type="submit" 
              class="login-button"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '登录中...' : '登 录' }}
            </button>
          </div>
          
          <!-- 登录错误信息 -->
          <div class="login-error" v-if="loginError">
            {{ loginError }}
          </div>
        </form>
      </div>
      
      <div class="login-footer">
        <p>版权所有 © 2023 军方仿真训练管理系统</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        userType: 'admin',
        username: '',
        password: '',
        remember: false
      },
      errors: {
        username: '',
        password: ''
      },
      showPassword: false,
      isSubmitting: false,
      loginError: ''
    }
  },
  methods: {
    validateUsername() {
      if (!this.loginForm.username) {
        this.errors.username = '请输入账号'
        return false
      }
      if (this.loginForm.username.length < 3) {
        this.errors.username = '账号长度不能少于3位'
        return false
      }
      this.errors.username = ''
      return true
    },
    validatePassword() {
      if (!this.loginForm.password) {
        this.errors.password = '请输入密码'
        return false
      }
      if (this.loginForm.password.length < 6) {
        this.errors.password = '密码长度不能少于6位'
        return false
      }
      this.errors.password = ''
      return true
    },
    validateForm() {
      const isUsernameValid = this.validateUsername()
      const isPasswordValid = this.validatePassword()
      return isUsernameValid && isPasswordValid
    },
    async handleLogin() {
      // 表单验证
      if (!this.validateForm()) {
        return
      }
      
      this.isSubmitting = true
      this.loginError = ''
      
      try {
        // 根据用户类型构造用户名
        let username = this.loginForm.username
        if (this.loginForm.userType !== 'admin') {
          username = `${this.loginForm.userType}${this.loginForm.username}`
        }

        // 调用Vuex登录action
        await this.$store.dispatch('user/loginUser', {
          username,
          password: this.loginForm.password
        })
        
        // 记住密码
        if (this.loginForm.remember) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            userType: this.loginForm.userType,
            username: this.loginForm.username,
            password: this.loginForm.password
          }))
        } else {
          localStorage.removeItem('rememberedUser')
        }
        
        // 登录成功，跳转到首页
        this.$router.push('/analysis')
      } catch (error) {
        console.error('登录失败:', error)
        this.loginError = '登录失败，请稍后再试'
      } finally {
        this.isSubmitting = false
      }
    },
    checkRememberedUser() {
      const rememberedUser = localStorage.getItem('rememberedUser')
      if (rememberedUser) {
        const userData = JSON.parse(rememberedUser)
        this.loginForm.userType = userData.userType
        this.loginForm.username = userData.username
        this.loginForm.password = userData.password
        this.loginForm.remember = true
      }
    }
  },
  mounted() {
    // 检查是否有记住的用户信息
    this.checkRememberedUser()
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #f5f7fa;
}

/* 左侧品牌区域 */
.brand-area {
  flex: 0 0 40%;
  background-color: #0C2D48;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBDMkQ0OCIvPjxwYXRoIGQ9Ik0wIDAgTDEwMCAxMDAiIHN0cm9rZT0iIzE2NDA2MiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMCAxMDAgTDEwMCAwIiBzdHJva2U9IiMxNjQwNjIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+');
  background-size: 20px 20px;
  opacity: 0.1;
}

.brand-content {
  text-align: center;
  z-index: 1;
  padding: 0 40px;
}

.system-name {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.system-desc {
  font-size: 16px;
  opacity: 0.8;
  letter-spacing: 1px;
}

/* 右侧登录表单区域 */
.login-form-area {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
}

.login-form-container {
  width: 400px;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.login-title {
  text-align: center;
  font-size: 24px;
  color: #0C2D48;
  margin-bottom: 30px;
  font-weight: 500;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.input-control {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.input-control:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.input-error {
  border-color: #f5222d;
}

.error-msg {
  color: #f5222d;
  font-size: 12px;
  margin-top: 4px;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
  cursor: pointer;
  user-select: none;
}

.remember-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input {
  margin-right: 6px;
}

.forgot-password {
  font-size: 14px;
  color: #1890ff;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  height: 40px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #40a9ff;
}

.login-button:disabled {
  background-color: #bae7ff;
  cursor: not-allowed;
}

.login-error {
  text-align: center;
  color: #f5222d;
  margin-top: 16px;
  font-size: 14px;
}

.login-footer {
  margin-top: 40px;
  color: #999;
  font-size: 12px;
}

@media screen and (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .brand-area {
    flex: 0 0 30%;
  }
  
  .login-form-area {
    flex: 0 0 70%;
  }
  
  .login-form-container {
    width: 90%;
    max-width: 400px;
  }
}
</style> 