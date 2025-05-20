<template>
  <div class="user-management-container">
    <div class="page-header">
    <h1 class="page-title">用户管理</h1>
      <div class="header-actions">
        <button class="add-user-btn" @click="openAddUserModal" v-if="isAdmin">
          <i class="el-icon-plus"></i> 新增用户
        </button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-panel">
      <div class="search-form">
        <div class="form-item">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="请输入用户名/姓名搜索" 
          class="search-input" 
          @keyup.enter="searchUsers"
        />
        </div>
        <div class="form-item">
        <select v-model="filterRole" class="filter-select">
          <option value="">全部角色</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
        </select>
        </div>
        <div class="form-item">
        <button class="search-btn" @click="searchUsers">查询</button>
        <button class="reset-btn" @click="resetSearch">重置</button>
      </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="table-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th width="60">序号</th>
            <th width="120">用户名</th>
            <th width="120">姓名</th>
            <th width="120">角色</th>
            <th width="150">部门/班级</th>
            <th width="180">最后登录时间</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullName }}</td>
            <td>
              <span class="role-badge" :class="getRoleType(user.roleId)">
                {{ getRoleName(user.roleId) }}
              </span>
            </td>
            <td>{{ user.department }}</td>
            <td>{{ formatDate(user.lastLogin) }}</td>
            <td class="action-column">
              <template v-if="isAdmin">
              <button 
                  class="action-btn edit-btn" 
                @click="openEditRoleModal(user)"
                v-if="canEditUserRole(user)"
              >
                修改角色
              </button>
              <button 
                  class="action-btn password-btn" 
                  @click="openModifyPasswordModal(user)"
              >
                  修改密码
              </button>
                <button 
                  class="action-btn delete-btn" 
                  @click="confirmDeleteUser(user)"
                  v-if="canDeleteUser(user)"
                >
                  删除
                </button>
              </template>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-data">暂无用户数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 新增用户弹窗 -->
    <el-dialog
      title="新增用户"
      :visible.sync="showAddUserModal"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="dialog-body">
        <div class="form-group">
          <label class="required">用户名</label>
          <input 
            type="text" 
            v-model="newUserForm.username" 
            placeholder="请输入用户名"
            class="form-input"
          />
          <div class="error-text" v-if="newUserForm.errors.username">{{ newUserForm.errors.username }}</div>
      </div>
        <div class="form-group">
          <label class="required">姓名</label>
          <input 
            type="text" 
            v-model="newUserForm.fullName" 
            placeholder="请输入姓名"
            class="form-input"
          />
          <div class="error-text" v-if="newUserForm.errors.fullName">{{ newUserForm.errors.fullName }}</div>
        </div>
        <div class="form-group">
          <label class="required">角色</label>
          <select v-model="newUserForm.roleId" class="form-input">
            <option value="">请选择角色</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
          <div class="error-text" v-if="newUserForm.errors.roleId">{{ newUserForm.errors.roleId }}</div>
        </div>
        <div class="form-group">
          <label class="required">部门/班级</label>
          <input 
            type="text" 
            v-model="newUserForm.department" 
            placeholder="请输入部门或班级"
            class="form-input"
          />
          <div class="error-text" v-if="newUserForm.errors.department">{{ newUserForm.errors.department }}</div>
      </div>
        <div class="form-group">
          <label class="required">密码</label>
          <input 
            type="password" 
            v-model="newUserForm.password" 
            placeholder="请输入密码"
            class="form-input"
          />
          <div class="error-text" v-if="newUserForm.errors.password">{{ newUserForm.errors.password }}</div>
          <div class="hint-text">密码长度至少8位，必须包含字母和数字</div>
      </div>
        <div class="form-group">
          <label class="required">确认密码</label>
          <input 
            type="password" 
            v-model="newUserForm.confirmPassword" 
            placeholder="请再次输入密码"
            class="form-input"
          />
          <div class="error-text" v-if="newUserForm.errors.confirmPassword">{{ newUserForm.errors.confirmPassword }}</div>
    </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <button class="btn cancel-btn" @click="closeAddUserModal">取 消</button>
        <button 
          class="btn confirm-btn" 
          @click="addUser"
          :disabled="!isNewUserFormValid"
        >
          确 定
        </button>
      </div>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      title="修改用户密码"
      :visible.sync="showModifyPasswordModal"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="dialog-body">
        <div class="user-info">
          正在修改用户 <span class="highlight">{{ selectedUser.username }}</span> 
          ({{ selectedUser.fullName }}) 的密码
      </div>
        <div class="form-group">
          <label class="required">新密码</label>
          <input 
            type="password" 
            v-model="modifyPasswordForm.newPassword" 
            placeholder="请输入新密码"
            class="form-input"
          />
          <div class="error-text" v-if="modifyPasswordForm.errors.newPassword">{{ modifyPasswordForm.errors.newPassword }}</div>
          <div class="hint-text">密码长度至少8位，必须包含字母和数字</div>
        </div>
        <div class="form-group">
          <label class="required">确认新密码</label>
          <input 
            type="password" 
            v-model="modifyPasswordForm.confirmPassword" 
            placeholder="请再次输入新密码"
            class="form-input"
          />
          <div class="error-text" v-if="modifyPasswordForm.errors.confirmPassword">{{ modifyPasswordForm.errors.confirmPassword }}</div>
        </div>
        </div>
      <div slot="footer" class="dialog-footer">
        <button class="btn cancel-btn" @click="closeModifyPasswordModal">取 消</button>
        <button 
          class="btn confirm-btn" 
          @click="modifyPassword"
          :disabled="!isModifyPasswordFormValid"
        >
          确 定
        </button>
      </div>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="删除用户"
      :visible.sync="showDeleteConfirmModal"
      width="400px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="dialog-body">
        <div class="confirm-message">
          确定要删除用户 <span class="highlight danger">{{ selectedUser.username }}</span> 
          ({{ selectedUser.fullName }}) 吗？
          <div class="warning-text">此操作不可恢复，请谨慎操作！</div>
      </div>
        </div>
      <div slot="footer" class="dialog-footer">
        <button class="btn cancel-btn" @click="closeDeleteConfirmModal">取 消</button>
        <button class="btn delete-btn" @click="deleteUser">确定删除</button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'UserManagement',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      filterRole: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 修改角色弹窗
      showEditRoleModal: false,
      editingUser: {
        id: null,
        username: '',
        fullName: '',
        roleId: null
      },
      
      // 重置密码弹窗
      showResetPasswordModal: false,
      resetPasswordUser: {
        id: null,
        username: '',
        fullName: ''
      },
      resetPasswordForm: {
        newPassword: '',
        confirmPassword: '',
        error: ''
      },
      
      // 角色数据
      roles: [
        { id: 1, name: '系统管理员', type: 'admin', description: '拥有系统全部功能的访问权限，可以进行系统配置、用户管理等操作' },
        { id: 2, name: '导调员', type: 'operation', description: '可以管理班级、编组、课程，查看学员成绩，进行评价' },
        { id: 3, name: '学员', type: 'view', description: '可以查看课程、进行训练，查看自己的成绩和评价' },
        { id: 4, name: '训练监督', type: 'operation', description: '可以查看所有班级的训练情况，进行监督和评价' },
        { id: 5, name: '资料管理员', type: 'operation', description: '负责上传、管理训练资料和多媒体教学内容' }
      ],
      
      // 用户数据
      users: [
        {
          id: 1,
          username: 'admin',
          fullName: '张系统',
          roleId: 1,
          department: '系统管理部',
          lastLogin: new Date('2023-05-14 10:25:33')
        },
        {
          id: 2,
          username: 'instructor_li',
          fullName: '李教官',
          roleId: 2,
          department: '训练教导队',
          lastLogin: new Date('2023-05-14 09:15:22')
        },
        {
          id: 3,
          username: 'student_wang',
          fullName: '王学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-13 16:42:11')
        },
        {
          id: 4,
          username: 'supervisor_zhao',
          fullName: '赵督导',
          roleId: 4,
          department: '训练督导组',
          lastLogin: new Date('2023-05-13 14:30:40')
        },
        {
          id: 5,
          username: 'material_chen',
          fullName: '陈管理',
          roleId: 5,
          department: '资料管理科',
          lastLogin: new Date('2023-05-12 11:20:18')
        },
        {
          id: 6,
          username: 'instructor_sun',
          fullName: '孙教官',
          roleId: 2,
          department: '特战训练队',
          lastLogin: new Date('2023-05-12 09:05:47')
        },
        {
          id: 7,
          username: 'student_liu',
          fullName: '刘学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-11 15:38:29')
        },
        {
          id: 8,
          username: 'student_yang',
          fullName: '杨学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-11 14:22:05')
        },
        {
          id: 9,
          username: 'student_zhang',
          fullName: '张学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-10 16:30:45')
        },
        {
          id: 10,
          username: 'student_zhao',
          fullName: '赵学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-10 15:45:12')
        },
        {
          id: 11,
          username: 'student_qian',
          fullName: '钱学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-10 14:22:36')
        },
        {
          id: 12,
          username: 'student_sun',
          fullName: '孙学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-10 11:15:20')
        },
        {
          id: 13,
          username: 'student_li',
          fullName: '李学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-09 16:40:55')
        },
        {
          id: 14,
          username: 'student_zhou',
          fullName: '周学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-09 15:35:42')
        },
        {
          id: 15,
          username: 'student_wu',
          fullName: '吴学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-09 14:28:33')
        },
        {
          id: 16,
          username: 'student_zheng',
          fullName: '郑学员',
          roleId: 3,
          department: '特种作战训练班',
          lastLogin: new Date('2023-05-09 11:05:19')
        },
        {
          id: 17,
          username: 'student_gao',
          fullName: '高学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-08 16:22:15')
        },
        {
          id: 18,
          username: 'student_lin',
          fullName: '林学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-08 15:10:25')
        },
        {
          id: 19,
          username: 'student_he',
          fullName: '何学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-08 14:15:30')
        },
        {
          id: 20,
          username: 'student_ma',
          fullName: '马学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-08 11:20:40')
        },
        {
          id: 21,
          username: 'student_luo',
          fullName: '罗学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-07 16:35:22')
        },
        {
          id: 22,
          username: 'student_peng',
          fullName: '彭学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-07 15:30:18')
        },
        {
          id: 23,
          username: 'student_chen',
          fullName: '陈学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-07 14:25:10')
        },
        {
          id: 24,
          username: 'student_xie',
          fullName: '谢学员',
          roleId: 3,
          department: '新兵连一班',
          lastLogin: new Date('2023-05-07 11:15:05')
        },
        {
          id: 25,
          username: 'student_hu',
          fullName: '胡学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-06 16:45:30')
        },
        {
          id: 26,
          username: 'student_tian',
          fullName: '田学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-06 15:40:25')
        },
        {
          id: 27,
          username: 'student_xu',
          fullName: '徐学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-06 14:35:20')
        },
        {
          id: 28,
          username: 'student_deng',
          fullName: '邓学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-06 11:30:15')
        },
        {
          id: 29,
          username: 'student_cao',
          fullName: '曹学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-05 16:25:10')
        },
        {
          id: 30,
          username: 'student_feng',
          fullName: '冯学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-05 15:20:05')
        },
        {
          id: 31,
          username: 'student_tang',
          fullName: '唐学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-05 14:15:00')
        },
        {
          id: 32,
          username: 'student_pan',
          fullName: '潘学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-05 11:10:55')
        },
        {
          id: 33,
          username: 'student_liang',
          fullName: '梁学员',
          roleId: 3,
          department: '新兵连二班',
          lastLogin: new Date('2023-05-04 16:05:50')
        }
      ],
      
      // 新增用户表单
      showAddUserModal: false,
      newUserForm: {
        username: '',
        fullName: '',
        roleId: '',
        department: '',
        password: '',
        confirmPassword: '',
        errors: {
          username: '',
          fullName: '',
          roleId: '',
          department: '',
          password: '',
          confirmPassword: ''
        }
      },
      
      // 修改密码表单
      showModifyPasswordModal: false,
      modifyPasswordForm: {
        newPassword: '',
        confirmPassword: '',
        errors: {
          newPassword: '',
          confirmPassword: ''
        }
      },
      
      // 删除确认
      showDeleteConfirmModal: false,
      selectedUser: {
        id: null,
        username: '',
        fullName: ''
      }
    }
  },
  computed: {
    ...mapGetters(['getUserInfo']),
    
    // 当前登录用户信息
    currentUser() {
      return this.getUserInfo || { roleId: 0, username: 'unknown' };
    },
    
    // 是否为管理员
    isAdmin() {
      return this.getUserInfo?.role === 'admin'
    },
    
    // 重置密码表单是否有效
    isResetPasswordFormValid() {
      return this.resetPasswordForm.newPassword && 
             this.resetPasswordForm.confirmPassword && 
             this.resetPasswordForm.newPassword === this.resetPasswordForm.confirmPassword &&
             this.validatePassword(this.resetPasswordForm.newPassword)
    },
    
    // 过滤后的用户列表
    filteredUsers() {
      let filtered = [...this.users]
      
      // 关键字搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(keyword) || 
          user.fullName.toLowerCase().includes(keyword)
        )
      }
      
      // 角色筛选
      if (this.filterRole) {
        filtered = filtered.filter(user => user.roleId === parseInt(this.filterRole))
      }
      
      return filtered
    },
    
    // 总页数
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.pageSize)
    },
    
    // 新增用户表单是否有效
    isNewUserFormValid() {
      return this.newUserForm.username && 
             this.newUserForm.fullName && 
             this.newUserForm.roleId && 
             this.newUserForm.department && 
             this.newUserForm.password && 
             this.newUserForm.confirmPassword && 
             this.newUserForm.password === this.newUserForm.confirmPassword &&
             this.validatePassword(this.newUserForm.password)
    },
    
    // 修改密码表单是否有效
    isModifyPasswordFormValid() {
      return this.modifyPasswordForm.newPassword && 
             this.modifyPasswordForm.confirmPassword && 
             this.modifyPasswordForm.newPassword === this.modifyPasswordForm.confirmPassword &&
             this.validatePassword(this.modifyPasswordForm.newPassword)
    }
  },
  methods: {
    // 搜索用户
    searchUsers() {
      this.currentPage = 1;
    },
    
    // 重置搜索
    resetSearch() {
      this.searchKeyword = '';
      this.filterRole = '';
      this.currentPage = 1;
    },
    
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    
    // 获取角色名称
    getRoleName(roleId) {
      const role = this.roles.find(r => r.id === roleId);
      return role ? role.name : '未知角色';
    },
    
    // 获取角色类型（用于样式）
    getRoleType(roleId) {
      const role = this.roles.find(r => r.id === roleId);
      return role ? role.type : 'unknown';
    },
    
    // 格式化日期
    formatDate(date) {
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 判断是否可以编辑用户角色
    canEditUserRole(user) {
      // 系统管理员可以修改任何人的角色，除了自己
      if (this.currentUser.roleId === 1 && this.currentUser.username !== user.username) {
        return true;
      }
      
      return false;
    },
    
    // 判断是否可以重置用户密码
    canResetUserPassword(user) {
      // 管理员可以修改所有用户的密码，包括自己
      return this.isAdmin
    },
    
    // ========== 修改角色相关 ==========
    // 打开修改角色弹窗
    openEditRoleModal(user) {
      this.editingUser = { ...user };
      this.showEditRoleModal = true;
    },
    
    // 关闭修改角色弹窗
    closeEditRoleModal() {
      this.showEditRoleModal = false;
      this.editingUser = {
        id: null,
        username: '',
        fullName: '',
        roleId: null
      };
    },
    
    // 获取选中角色的描述
    getSelectedRoleDescription() {
      const role = this.roles.find(r => r.id === this.editingUser.roleId);
      return role ? role.description : '';
    },
    
    // 保存用户角色
    saveUserRole() {
      const userIndex = this.users.findIndex(u => u.id === this.editingUser.id);
      if (userIndex !== -1) {
        // 更新用户角色
        this.users[userIndex].roleId = this.editingUser.roleId;
        
        // 显示成功提示
        alert(`已成功将用户 ${this.editingUser.username} 的角色修改为 ${this.getRoleName(this.editingUser.roleId)}`);
        
        this.closeEditRoleModal();
      }
    },
    
    // ========== 重置密码相关 ==========
    // 打开重置密码弹窗
    openResetPasswordModal(user) {
      this.resetPasswordUser = { ...user }
      this.resetPasswordForm = {
        newPassword: '',
        confirmPassword: '',
        error: ''
      }
      this.showResetPasswordModal = true
    },
    
    // 关闭重置密码弹窗
    closeResetPasswordModal() {
      this.showResetPasswordModal = false
      this.resetPasswordUser = {
        id: null,
        username: '',
        fullName: ''
      }
      this.resetPasswordForm = {
        newPassword: '',
        confirmPassword: '',
        error: ''
      }
    },
    
    // 验证密码格式
    validatePassword(password) {
      // 密码长度至少8位，必须包含字母和数字
      const hasNumber = /\d/.test(password)
      const hasLetter = /[a-zA-Z]/.test(password)
      return password.length >= 8 && hasNumber && hasLetter
    },
    
    // 重置用户密码
    async resetPassword() {
      // 验证密码
      if (!this.validatePassword(this.resetPasswordForm.newPassword)) {
        this.resetPasswordForm.error = '密码必须至少8位，且包含字母和数字'
        return
      }
      
      // 验证两次密码输入是否一致
      if (this.resetPasswordForm.newPassword !== this.resetPasswordForm.confirmPassword) {
        this.resetPasswordForm.error = '两次输入的密码不一致'
        return
      }
      
      try {
        await this.$api.resetUserPassword({
          userId: this.resetPasswordUser.id,
          newPassword: this.resetPasswordForm.newPassword
        })
        
        this.$message.success(`已成功修改用户 ${this.resetPasswordUser.username} 的密码`)
        this.closeResetPasswordModal()
      } catch (error) {
        console.error('修改密码失败:', error)
        this.$message.error('密码修改失败，请重试')
      }
    },
    
    // 判断是否可以修改用户密码
    canModifyUserPassword(user) {
      return this.isAdmin
    },
    
    // 判断是否可以删除用户
    canDeleteUser(user) {
      return this.isAdmin && this.currentUser.username !== user.username
    },
    
    // ========== 新增用户相关 ==========
    openAddUserModal() {
      this.newUserForm = {
        username: '',
        fullName: '',
        roleId: '',
        department: '',
        password: '',
        confirmPassword: '',
        errors: {
          username: '',
          fullName: '',
          roleId: '',
          department: '',
          password: '',
          confirmPassword: ''
        }
      }
      this.showAddUserModal = true
    },
    
    closeAddUserModal() {
      this.showAddUserModal = false
    },
    
    async addUser() {
      // 验证表单
      if (!this.validateNewUserForm()) {
        return
      }
      
      try {
        const response = await this.$api.createUser({
          username: this.newUserForm.username,
          fullName: this.newUserForm.fullName,
          roleId: this.newUserForm.roleId,
          department: this.newUserForm.department,
          password: this.newUserForm.password
        })
        
        // 添加到用户列表
        this.users.push(response.data)
        
        this.$message.success('用户创建成功')
        this.closeAddUserModal()
      } catch (error) {
        console.error('创建用户失败:', error)
        this.$message.error('创建用户失败，请重试')
      }
    },
    
    validateNewUserForm() {
      let isValid = true
      this.newUserForm.errors = {
        username: '',
        fullName: '',
        roleId: '',
        department: '',
        password: '',
        confirmPassword: ''
      }
      
      if (!this.newUserForm.username) {
        this.newUserForm.errors.username = '请输入用户名'
        isValid = false
      }
      
      if (!this.newUserForm.fullName) {
        this.newUserForm.errors.fullName = '请输入姓名'
        isValid = false
      }
      
      if (!this.newUserForm.roleId) {
        this.newUserForm.errors.roleId = '请选择角色'
        isValid = false
      }
      
      if (!this.newUserForm.department) {
        this.newUserForm.errors.department = '请输入部门/班级'
        isValid = false
      }
      
      if (!this.newUserForm.password) {
        this.newUserForm.errors.password = '请输入密码'
        isValid = false
      } else if (!this.validatePassword(this.newUserForm.password)) {
        this.newUserForm.errors.password = '密码必须至少8位，且包含字母和数字'
        isValid = false
      }
      
      if (!this.newUserForm.confirmPassword) {
        this.newUserForm.errors.confirmPassword = '请再次输入密码'
        isValid = false
      } else if (this.newUserForm.password !== this.newUserForm.confirmPassword) {
        this.newUserForm.errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }
      
      return isValid
    },
    
    // ========== 修改密码相关 ==========
    openModifyPasswordModal(user) {
      this.selectedUser = { ...user }
      this.modifyPasswordForm = {
        newPassword: '',
        confirmPassword: '',
        errors: {
          newPassword: '',
          confirmPassword: ''
        }
      }
      this.showModifyPasswordModal = true
    },
    
    closeModifyPasswordModal() {
      this.showModifyPasswordModal = false
      this.selectedUser = {
        id: null,
        username: '',
        fullName: ''
      }
      this.modifyPasswordForm = {
        newPassword: '',
        confirmPassword: '',
        errors: {
          newPassword: '',
          confirmPassword: ''
        }
      }
    },
    
    async modifyPassword() {
      // 验证密码
      if (!this.validateModifyPasswordForm()) {
        return
      }
      
      try {
        await this.$api.modifyUserPassword({
          userId: this.selectedUser.id,
          newPassword: this.modifyPasswordForm.newPassword
        })
        
        this.$message.success(`已成功修改用户 ${this.selectedUser.username} 的密码`)
        this.closeModifyPasswordModal()
      } catch (error) {
        console.error('修改密码失败:', error)
        this.$message.error('密码修改失败，请重试')
      }
    },
    
    validateModifyPasswordForm() {
      let isValid = true
      this.modifyPasswordForm.errors = {
        newPassword: '',
        confirmPassword: ''
      }
      
      if (!this.modifyPasswordForm.newPassword) {
        this.modifyPasswordForm.errors.newPassword = '请输入新密码'
        isValid = false
      } else if (!this.validatePassword(this.modifyPasswordForm.newPassword)) {
        this.modifyPasswordForm.errors.newPassword = '密码必须至少8位，且包含字母和数字'
        isValid = false
      }
      
      if (!this.modifyPasswordForm.confirmPassword) {
        this.modifyPasswordForm.errors.confirmPassword = '请再次输入新密码'
        isValid = false
      } else if (this.modifyPasswordForm.newPassword !== this.modifyPasswordForm.confirmPassword) {
        this.modifyPasswordForm.errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }
      
      return isValid
    },
    
    // ========== 删除用户相关 ==========
    confirmDeleteUser(user) {
      this.selectedUser = { ...user }
      this.showDeleteConfirmModal = true
    },
    
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false
      this.selectedUser = {
        id: null,
        username: '',
        fullName: ''
      }
    },
    
    async deleteUser() {
      try {
        await this.$api.deleteUser(this.selectedUser.id)
        
        // 从列表中移除
        const index = this.users.findIndex(u => u.id === this.selectedUser.id)
        if (index !== -1) {
          this.users.splice(index, 1)
        }
        
        this.$message.success(`已成功删除用户 ${this.selectedUser.username}`)
        this.closeDeleteConfirmModal()
      } catch (error) {
        console.error('删除用户失败:', error)
        this.$message.error('删除用户失败，请重试')
      }
    }
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  color: #1f2f3d;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.add-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 36px;
  background-color: #2b85e4;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-user-btn:hover {
  background-color: #2472c8;
}

/* 搜索面板样式 */
.search-panel {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.search-form {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.form-item {
  display: flex;
  gap: 8px;
}

.search-input,
.filter-select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 240px;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-select {
  width: 160px;
}

.search-input:focus,
.filter-select:focus {
  border-color: #2b85e4;
  outline: none;
}

.search-btn,
.reset-btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.search-btn {
  background-color: #2b85e4;
  color: #fff;
}

.search-btn:hover {
  background-color: #2472c8;
}

.reset-btn {
  background-color: #f4f4f5;
  color: #606266;
}

.reset-btn:hover {
  background-color: #e9e9eb;
}

/* 表格面板样式 */
.table-panel {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.data-table th {
  background-color: #fafafa;
  color: #606266;
  font-weight: 500;
}

.data-table tr:hover td {
  background-color: #f5f7fa;
}

.text-center {
  text-align: center;
}

.action-column {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.action-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.edit-btn {
  background-color: #e6f7ff;
  color: #2b85e4;
}

.edit-btn:hover {
  background-color: #bae7ff;
}

.password-btn {
  background-color: #f0f9eb;
  color: #67c23a;
}

.password-btn:hover {
  background-color: #e1f3d8;
}

.delete-btn {
  background-color: #fff0f0;
  color: #f56c6c;
}

.delete-btn:hover {
  background-color: #fde2e2;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.role-badge.admin {
  background-color: #2b85e4;
}

.role-badge.operation {
  background-color: #67c23a;
}

.role-badge.view {
  background-color: #909399;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.page-btn {
  padding: 0 16px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:not(:disabled):hover {
  border-color: #2b85e4;
  color: #2b85e4;
}

.page-btn:disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #606266;
}

/* 弹窗样式 */
.custom-dialog {
  border-radius: 4px;
}

.dialog-body {
  padding: 20px 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.required::before {
  content: "*";
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-input:focus {
  border-color: #2b85e4;
  outline: none;
}

.error-text {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.hint-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  padding: 20px;
  text-align: right;
}

.btn {
  padding: 0 20px;
  height: 36px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 10px;
}

.cancel-btn {
  background-color: #f4f4f5;
  color: #606266;
}

.cancel-btn:hover {
  background-color: #e9e9eb;
}

.confirm-btn {
  background-color: #2b85e4;
  color: #fff;
}

.confirm-btn:hover {
  background-color: #2472c8;
}

.confirm-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.user-info {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

.highlight {
  color: #2b85e4;
  font-weight: 500;
}

.highlight.danger {
  color: #f56c6c;
}

.confirm-message {
  text-align: center;
  font-size: 16px;
  color: #606266;
  padding: 20px 0;
}

.warning-text {
  margin-top: 12px;
  font-size: 14px;
  color: #e6a23c;
}

.empty-data {
  text-align: center;
  padding: 32px;
  color: #909399;
  font-size: 14px;
}
</style> 