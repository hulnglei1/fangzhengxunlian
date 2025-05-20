<!-- 个人中心页面 -->
<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>个人中心</h2>
    </div>

    <div class="profile-content">
      <!-- 个人基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>基本信息</h3>
          <el-button type="text" @click="startEdit" v-if="!isEditing">编辑</el-button>
          <div v-else>
            <el-button type="primary" size="small" @click="saveChanges">保存</el-button>
            <el-button size="small" @click="cancelEdit">取消</el-button>
          </div>
        </div>
        
        <div class="info-content">
          <el-form :model="userInfo" label-width="100px" :disabled="!isEditing">
            <el-form-item label="用户名">
              <el-input v-model="userInfo.username" disabled></el-input>
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="userInfo.name"></el-input>
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="userInfo.phone"></el-input>
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="userInfo.email"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 最近训练记录 -->
      <div class="info-card">
        <div class="card-header">
          <h3>最近训练记录</h3>
          <el-button type="text" @click="viewAllRecords">查看全部</el-button>
        </div>
        
        <div class="training-records">
          <el-table :data="recentTrainingRecords" style="width: 100%">
            <el-table-column prop="courseName" label="课程名称"></el-table-column>
            <el-table-column prop="date" label="训练时间"></el-table-column>
            <el-table-column prop="duration" label="用时"></el-table-column>
            <el-table-column prop="score" label="得分"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button type="text" @click="viewDetail(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 修改密码卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h3>修改密码</h3>
        </div>
        
        <div class="password-form">
          <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordForm">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password"></el-input>
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile',
  data() {
    // 密码确认验证
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      isEditing: false,
      userInfo: {
        username: '',
        name: '',
        phone: '',
        email: ''
      },
      recentTrainingRecords: [],
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchUserInfo()
    this.fetchRecentTrainingRecords()
  },
  methods: {
    // 获取用户信息
    async fetchUserInfo() {
      try {
        // TODO: 调用后端API获取用户信息
        const response = await this.$api.getUserInfo()
        this.userInfo = response.data
      } catch (error) {
        this.$message.error('获取用户信息失败')
      }
    },

    // 获取最近训练记录
    async fetchRecentTrainingRecords() {
      try {
        // TODO: 调用后端API获取最近训练记录
        const response = await this.$api.getRecentTrainingRecords()
        this.recentTrainingRecords = response.data
      } catch (error) {
        this.$message.error('获取训练记录失败')
      }
    },

    // 开始编辑
    startEdit() {
      this.isEditing = true
    },

    // 保存修改
    async saveChanges() {
      try {
        // TODO: 调用后端API保存用户信息
        await this.$api.updateUserInfo(this.userInfo)
        this.$message.success('保存成功')
        this.isEditing = false
      } catch (error) {
        this.$message.error('保存失败')
      }
    },

    // 取消编辑
    cancelEdit() {
      this.isEditing = false
      this.fetchUserInfo() // 重新获取用户信息
    },

    // 查看所有记录
    viewAllRecords() {
      this.$router.push('/training-records')
    },

    // 查看记录详情
    viewDetail(record) {
      this.$router.push(`/training-records/${record.id}`)
    },

    // 修改密码
    async changePassword() {
      try {
        await this.$refs.passwordForm.validate()
        // TODO: 调用后端API修改密码
        await this.$api.changePassword(this.passwordForm)
        this.$message.success('密码修改成功')
        this.passwordForm = {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        if (error === false) return // 表单验证失败
        this.$message.error('密码修改失败')
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-header {
  margin-bottom: 20px;
}

.profile-content {
  display: grid;
  gap: 20px;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.info-content {
  max-width: 600px;
}

.training-records {
  margin-top: 10px;
}

.password-form {
  max-width: 400px;
}
</style> 