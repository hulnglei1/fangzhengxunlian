<template>
  <div class="role-management-container" v-permission="'roleManagement:view'">
    <h1 class="page-title">角色管理</h1>

    <!-- 搜索和创建区域 -->
    <div class="action-bar">
      <div class="search-area">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="请输入角色名称搜索" 
          class="search-input"
          @keyup.enter="searchRoles"
        />
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="admin">管理类</option>
          <option value="operation">操作类</option>
          <option value="view">查看类</option>
        </select>
        <button class="search-btn" @click="searchRoles">查询角色</button>
        <button class="reset-btn" @click="resetSearch">重置</button>
      </div>
      <button 
        class="create-btn" 
        v-permission="'roleManagement:add'"
        @click="openCreateModal"
      >
        创建角色
      </button>
    </div>
    
    <!-- 角色列表 -->
    <div class="role-list">
      <table class="role-table">
        <thead>
          <tr>
            <th width="5%">序号</th>
            <th width="15%">角色名称</th>
            <th width="15%">角色类型</th>
            <th width="30%">权限描述</th>
            <th width="15%">创建时间</th>
            <th width="20%">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(role, index) in filteredRoles" :key="role.id">
            <td>{{ index + 1 }}</td>
            <td>{{ role.name }}</td>
            <td>
              <span class="role-type-tag" :class="role.type">
                {{ getTypeText(role.type) }}
              </span>
            </td>
            <td class="description-cell">{{ role.description }}</td>
            <td>{{ formatDate(role.createdAt) }}</td>
            <td class="actions-cell">
              <button 
                v-permission="'roleManagement:edit'"
                class="edit-btn" 
                @click="openEditModal(role)"
              >
                修改
              </button>
              <button 
                v-permission="'roleManagement:delete'"
                class="delete-btn" 
                @click="confirmDelete(role)"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="filteredRoles.length === 0">
            <td colspan="6" class="empty-data">暂无角色数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页控件 -->
    <div class="pagination-area" v-if="totalPages > 1">
      <button 
        class="pagination-btn" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        class="pagination-btn" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
    
    <!-- 创建/编辑角色弹窗 -->
    <div class="modal-backdrop" v-if="showModal" @click="closeModal"></div>
    <div class="modal" v-if="showModal">
      <div class="modal-header">
        <h3>{{ isEditing ? '修改角色' : '创建角色' }}</h3>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <!-- 基本信息 -->
        <div class="form-section">
          <h4>基本信息</h4>
          <div class="form-group">
            <label>角色名称</label>
            <input type="text" v-model="roleForm.name" placeholder="请输入角色名称" />
            <p class="error-text" v-if="formErrors.name">{{ formErrors.name }}</p>
          </div>
          <div class="form-group">
            <label>角色类型</label>
            <select v-model="roleForm.type">
              <option value="admin">管理类</option>
              <option value="operation">操作类</option>
              <option value="view">查看类</option>
            </select>
            <p class="error-text" v-if="formErrors.type">{{ formErrors.type }}</p>
          </div>
          <div class="form-group">
            <label>权限描述</label>
            <textarea 
              v-model="roleForm.description" 
              placeholder="请描述角色权限"
              rows="4"
            ></textarea>
            <p class="error-text" v-if="formErrors.description">{{ formErrors.description }}</p>
          </div>
        </div>

        <!-- 功能权限配置 -->
        <div class="form-section">
          <h4>功能权限配置</h4>
          <div class="permissions-grid">
            <div v-for="module in availableModules" :key="module.id" class="module-permissions">
              <div class="module-header">
                <label>
                  <input 
                    type="checkbox" 
                    :checked="isModuleSelected(module.id)"
                    @change="toggleModule(module.id)"
                  />
                  {{ module.name }}
                </label>
              </div>
              <div class="permission-actions">
                <label v-for="action in module.actions" :key="action.id">
                  <input 
                    type="checkbox" 
                    v-model="roleForm.permissions[module.id][action.id]"
                    :disabled="!isModuleSelected(module.id)"
                  />
                  {{ action.name }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="save-btn" @click="saveRole">保存</button>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div class="modal-backdrop" v-if="showDeleteConfirm" @click="cancelDelete"></div>
    <div class="modal delete-modal" v-if="showDeleteConfirm">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="modal-close" @click="cancelDelete">&times;</button>
      </div>
      <div class="modal-body">
        <p class="confirm-text">
          确定要删除角色 <span class="highlight">{{ pendingDeleteRole?.name }}</span> 吗？
          此操作无法撤销。
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDelete">取消</button>
        <button class="delete-confirm-btn" @click="deleteRole">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'RoleManagement',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      filterType: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 模态框控制
      showModal: false,
      isEditing: false,
      roleForm: {
        id: null,
        name: '',
        type: 'admin',
        description: '',
        permissions: {}
      },
      formErrors: {
        name: '',
        type: '',
        description: ''
      },
      
      // 删除确认
      showDeleteConfirm: false,
      pendingDeleteRole: null,
      
      // 可用模块及其操作权限
      availableModules: [
        {
          id: 'roleManagement',
          name: '角色管理',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'add', name: '新增' },
            { id: 'edit', name: '编辑' },
            { id: 'delete', name: '删除' }
          ]
        },
        {
          id: 'userManagement',
          name: '用户管理',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'add', name: '新增' },
            { id: 'edit', name: '编辑' },
            { id: 'delete', name: '删除' }
          ]
        },
        {
          id: 'classManagement',
          name: '班级管理',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'add', name: '新增' },
            { id: 'edit', name: '编辑' },
            { id: 'delete', name: '删除' }
          ]
        },
        {
          id: 'groupManagement',
          name: '编组管理',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'add', name: '新增' },
            { id: 'edit', name: '编辑' },
            { id: 'delete', name: '删除' }
          ]
        },
        {
          id: 'materialsManagement',
          name: '教学资料',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'preview', name: '预览' },
            { id: 'upload', name: '上传' },
            { id: 'edit', name: '编辑' },
            { id: 'delete', name: '删除' }
          ]
        },
        {
          id: 'scoreQuery',
          name: '成绩查询',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'review', name: '点评' }
          ]
        },
        {
          id: 'statisticsAnalysis',
          name: '统计分析',
          actions: [
            { id: 'view', name: '查看' },
            { id: 'scoreDistribution', name: '成绩分布' }
          ]
        },
        {
          id: 'profile',
          name: '个人中心',
          actions: [
            { id: 'view', name: '查看' }
          ]
        }
      ],
      
      // 预定义角色
      roles: [
        {
          id: 1,
          name: '系统管理员',
          type: 'admin',
          description: '拥有系统所有功能的最高权限',
          permissions: {
            roleManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            userManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            classManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            groupManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            materialsManagement: {
              view: true,
              preview: true,
              upload: true,
              edit: true,
              delete: true
            },
            scoreQuery: {
              view: true,
              review: true
            },
            statisticsAnalysis: {
              view: true,
              scoreDistribution: true
            }
          },
          dataScopes: {
            userManagement: 'admin',
            classManagement: 'admin',
            groupManagement: 'admin',
            scoreQuery: 'admin',
            statisticsAnalysis: 'admin'
          }
        },
        {
          id: 2,
          name: '教师',
          type: 'teacher',
          description: '可管理班级、编组、查看所带班级学员成绩并点评',
          permissions: {
            roleManagement: {
              view: false,
              add: false,
              edit: false,
              delete: false
            },
            userManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            classManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            groupManagement: {
              view: true,
              add: true,
              edit: true,
              delete: true
            },
            materialsManagement: {
              view: true,
              preview: true,
              upload: true,
              edit: true,
              delete: true
            },
            scoreQuery: {
              view: true,
              review: true
            },
            statisticsAnalysis: {
              view: true,
              scoreDistribution: true
            }
          },
          dataScopes: {
            userManagement: 'teacher',
            classManagement: 'teacher',
            groupManagement: 'teacher',
            scoreQuery: 'teacher',
            statisticsAnalysis: 'teacher'
          }
        },
        {
          id: 3,
          name: '学员',
          type: 'student',
          description: '可查看多媒体教学资料、参与训练、查看个人成绩',
          permissions: {
            roleManagement: {
              view: false,
              add: false,
              edit: false,
              delete: false
            },
            userManagement: {
              view: false,
              add: false,
              edit: false,
              delete: false
            },
            classManagement: {
              view: false,
              add: false,
              edit: false,
              delete: false
            },
            groupManagement: {
              view: false,
              add: false,
              edit: false,
              delete: false
            },
            materialsManagement: {
              view: true,
              preview: true,
              upload: false,
              edit: false,
              delete: false
            },
            scoreQuery: {
              view: true,
              review: false
            },
            statisticsAnalysis: {
              view: true,
              scoreDistribution: false
            }
          },
          dataScopes: {
            scoreQuery: 'student',
            statisticsAnalysis: 'student'
          }
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      hasPermission: 'permission/hasPermission'
    }),
    // 过滤后的角色列表
    filteredRoles() {
      let filtered = [...this.roles];
      
      // 应用关键字搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(role => 
          role.name.toLowerCase().includes(keyword) || 
          role.description.toLowerCase().includes(keyword)
        );
      }
      
      // 应用类型筛选
      if (this.filterType) {
        filtered = filtered.filter(role => role.type === this.filterType);
      }
      
      // 分页
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      
      return filtered.slice(startIndex, endIndex);
    },
    
    // 计算总页数
    totalPages() {
      let filtered = [...this.roles];
      
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(role => 
          role.name.toLowerCase().includes(keyword) || 
          role.description.toLowerCase().includes(keyword)
        );
      }
      
      if (this.filterType) {
        filtered = filtered.filter(role => role.type === this.filterType);
      }
      
      return Math.ceil(filtered.length / this.pageSize) || 1;
    }
  },
  created() {
    console.log('RoleManagement组件创建')
    // 检查权限
    const hasViewPermission = this.hasPermission('roleManagement', 'view')
    console.log('角色管理查看权限:', hasViewPermission)
    
    if (!hasViewPermission) {
      console.log('无权限访问角色管理页面')
      this.$router.push('/analysis')
      return
    }
  },
  mounted() {
    console.log('RoleManagement组件挂载')
  },
  errorCaptured(err, vm, info) {
    console.error('组件错误:', err)
    console.log('错误组件:', vm)
    console.log('错误信息:', info)
    return false
  },
  methods: {
    // 搜索角色
    searchRoles() {
      this.currentPage = 1;
    },
    
    // 重置搜索
    resetSearch() {
      this.searchKeyword = '';
      this.filterType = '';
      this.currentPage = 1;
    },
    
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    
    // 初始化角色表单
    initRoleForm() {
      this.roleForm = {
        id: null,
        name: '',
        type: 'admin',
        description: '',
        permissions: {}
      }
      
      // 初始化权限
      this.availableModules.forEach(module => {
        this.roleForm.permissions[module.id] = {}
        module.actions.forEach(action => {
          this.roleForm.permissions[module.id][action.id] = false
        })
      })
    },
    
    // 检查模块是否被选中
    isModuleSelected(moduleId) {
      const modulePermissions = this.roleForm.permissions[moduleId] || {}
      return Object.values(modulePermissions).some(value => value === true)
    },
    
    // 切换模块所有权限
    toggleModule(moduleId) {
      const isSelected = this.isModuleSelected(moduleId)
      const modulePermissions = this.roleForm.permissions[moduleId]
      
      Object.keys(modulePermissions).forEach(actionId => {
        modulePermissions[actionId] = !isSelected
      })
    },
    
    // 打开创建角色模态框
    openCreateModal() {
      this.isEditing = false
      this.initRoleForm()
      this.resetFormErrors()
      this.showModal = true
    },
    
    // 打开编辑角色模态框
    openEditModal(role) {
      this.isEditing = true
      this.initRoleForm()
      
      // 填充表单数据
      this.roleForm = {
        id: role.id,
        name: role.name,
        type: role.type,
        description: role.description,
        permissions: {}
      }

      // 初始化所有模块的权限
      this.availableModules.forEach(module => {
        this.roleForm.permissions[module.id] = {}
        module.actions.forEach(action => {
          // 如果有现有权限数据则使用，否则默认为false
          this.roleForm.permissions[module.id][action.id] = 
            role.permissions?.[module.id]?.[action.id] || false
        })
      })
      
      this.resetFormErrors()
      this.showModal = true
    },
    
    // 关闭模态框
    closeModal() {
      this.showModal = false;
    },
    
    // 保存角色
    saveRole() {
      // 验证表单
      if (!this.validateForm()) return
      
      const roleData = {
        ...this.roleForm,
        permissions: this.formatPermissions()
      }
      
      if (this.isEditing) {
        // 更新现有角色
        const index = this.roles.findIndex(r => r.id === roleData.id)
        if (index !== -1) {
          this.roles.splice(index, 1, roleData)
        }
      } else {
        // 创建新角色
        roleData.id = Math.max(...this.roles.map(r => r.id), 0) + 1
        roleData.createdAt = new Date()
        this.roles.push(roleData)
      }
      
      this.closeModal()
    },
    
    // 格式化权限数据
    formatPermissions() {
      const formattedPermissions = {}
      
      Object.entries(this.roleForm.permissions).forEach(([moduleId, actions]) => {
        formattedPermissions[moduleId] = {
          ...actions
        }
      })
      
      return formattedPermissions
    },
    
    // 验证表单
    validateForm() {
      this.resetFormErrors();
      let isValid = true;
      
      if (!this.roleForm.name.trim()) {
        this.formErrors.name = '角色名称不能为空';
        isValid = false;
      }
      
      if (!this.roleForm.type) {
        this.formErrors.type = '请选择角色类型';
        isValid = false;
      }
      
      if (!this.roleForm.description.trim()) {
        this.formErrors.description = '权限描述不能为空';
        isValid = false;
      }
      
      return isValid;
    },
    
    // 重置表单错误
    resetFormErrors() {
      this.formErrors = {
        name: '',
        type: '',
        description: ''
      };
    },
    
    // 确认删除
    confirmDelete(role) {
      this.pendingDeleteRole = role;
      this.showDeleteConfirm = true;
    },
    
    // 取消删除
    cancelDelete() {
      this.pendingDeleteRole = null;
      this.showDeleteConfirm = false;
    },
    
    // 删除角色
    deleteRole() {
      if (this.pendingDeleteRole) {
        const index = this.roles.findIndex(r => r.id === this.pendingDeleteRole.id);
        if (index !== -1) {
          this.roles.splice(index, 1);
        }
      }
      
      this.cancelDelete();
      
      // 检查当前页是否还有数据，如果没有则返回上一页
      if (this.filteredRoles.length === 0 && this.currentPage > 1) {
        this.currentPage--;
      }
    },
    
    // 格式化日期
    formatDate(date) {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    
    // 获取角色类型文本
    getTypeText(type) {
      const typeMap = {
        admin: '管理类',
        operation: '操作类',
        view: '查看类'
      };
      
      return typeMap[type] || '未知';
    },
    
    // 返回仪表盘
    goBack() {
      this.$router.push('/dashboard');
    }
  }
}
</script>

<style scoped>
.role-management-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.page-title {
  color: #0C2D48;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}

/* 操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-area {
  display: flex;
  gap: 10px;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.filter-select {
  min-width: 120px;
}

.search-btn,
.reset-btn,
.create-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.search-btn {
  background-color: #1890ff;
  color: white;
}

.reset-btn {
  background-color: #f2f2f2;
  color: #595959;
}

.create-btn {
  background-color: #52c41a;
  color: white;
}

/* 表格样式 */
.role-list {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.role-table {
  width: 100%;
  border-collapse: collapse;
}

.role-table th,
.role-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.role-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
}

.role-table tr:hover {
  background-color: #f5f5f5;
}

.role-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.role-type-tag.admin {
  background-color: #1890ff;
}

.role-type-tag.operation {
  background-color: #52c41a;
}

.role-type-tag.view {
  background-color: #722ed1;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.edit-btn {
  background-color: #faad14;
  color: white;
}

.delete-btn {
  background-color: #ff4d4f;
  color: white;
}

.empty-data {
  text-align: center;
  color: #8c8c8c;
  padding: 30px 0;
}

/* 分页区域 */
.pagination-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
}

.pagination-btn {
  padding: 6px 12px;
  background-color: #f2f2f2;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 5px;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  margin: 0 10px;
  color: #595959;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  width: 500px;
  max-width: 90%;
  z-index: 1001;
}

.delete-modal {
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  color: #0C2D48;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #8c8c8c;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn,
.save-btn,
.delete-confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #f2f2f2;
  color: #595959;
}

.save-btn {
  background-color: #1890ff;
  color: white;
}

.delete-confirm-btn {
  background-color: #ff4d4f;
  color: white;
}

/* 表单样式 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.error-text {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 5px;
}

.form-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.form-section h4 {
  margin: 0 0 15px;
  color: #0C2D48;
  font-size: 16px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.module-permissions {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 10px;
}

.module-header {
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #f0f0f0;
}

.module-header label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.permission-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.permission-actions label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-right: 15px;
}

/* 删除确认弹窗样式 */
.confirm-text {
  margin: 10px 0;
  line-height: 1.5;
}

.highlight {
  color: #ff4d4f;
  font-weight: 500;
}
</style> 