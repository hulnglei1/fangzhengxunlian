<template>
  <div class="course-management-container">
    <div class="page-header">
    <h1 class="page-title">课程管理</h1>
      <div class="header-actions">
        <button class="add-course-btn" @click="openAddCourseModal">
          <i class="el-icon-plus"></i> 新增课程
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
            placeholder="请输入课程名称搜索" 
            class="search-input" 
            @keyup.enter="searchCourses"
        />
        </div>
        <div class="form-item">
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="VR">VR课程</option>
            <option value="SIMULATION">仿真课程</option>
        </select>
        </div>
        <div class="form-item">
          <button class="search-btn" @click="searchCourses">查询</button>
          <button class="reset-btn" @click="resetSearch">重置</button>
        </div>
      </div>
      <div class="batch-actions" v-if="selectedCourses.length > 0">
        <span class="selected-count">已选择 {{ selectedCourses.length }} 项</span>
        <button class="delete-btn" @click="batchDelete">批量删除</button>
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="table-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th width="50">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="checkbox-input"
              />
            </th>
            <th width="60">序号</th>
            <th width="200">课程名称</th>
            <th width="100">课程类型</th>
            <th width="100">总分值</th>
            <th>课程说明</th>
            <th width="180">创建时间</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, index) in filteredCourses" :key="course.id">
            <td>
              <input 
                type="checkbox" 
                v-model="selectedCourses"
                :value="course.id"
                class="checkbox-input"
              />
            </td>
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ course.name }}</td>
            <td>
              <span 
                class="type-badge"
                :class="{ 'vr': course.type === 'VR', 'simulation': course.type === 'SIMULATION' }"
              >
                {{ course.type === 'VR' ? 'VR课程' : '仿真课程' }}
              </span>
            </td>
            <td class="text-center">{{ course.totalScore }}</td>
            <td class="description-cell">{{ course.description }}</td>
            <td>{{ formatDate(course.createTime) }}</td>
            <td class="action-column">
              <button 
                class="action-btn edit-btn" 
                @click="openEditCourseModal(course)"
              >
                编辑
              </button>
              <button 
                class="action-btn delete-btn" 
                @click="confirmDeleteCourse(course)"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="8" class="empty-data">暂无课程数据</td>
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

    <!-- 新增/编辑课程弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑课程' : '新增课程'"
      :visible.sync="showCourseModal"
      width="600px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="dialog-body">
        <div class="form-group">
          <label class="required">课程名称</label>
          <input 
            type="text" 
            v-model="courseForm.name" 
            placeholder="请输入课程名称"
            class="form-input"
          />
          <div class="error-text" v-if="courseForm.errors.name">{{ courseForm.errors.name }}</div>
      </div>
        <div class="form-group">
          <label class="required">课程类型</label>
          <select v-model="courseForm.type" class="form-input" @change="handleTypeChange">
            <option value="">请选择课程类型</option>
            <option value="VR">VR课程</option>
            <option value="SIMULATION">仿真课程</option>
          </select>
          <div class="error-text" v-if="courseForm.errors.type">{{ courseForm.errors.type }}</div>
        </div>

        <!-- 仿真课程特有字段 -->
        <template v-if="courseForm.type === 'SIMULATION'">
        <div class="form-group">
            <label class="required">仿真课程序号</label>
            <select v-model="courseForm.simulationId" class="form-input">
              <option value="">请选择仿真课程序号</option>
              <option v-for="item in simulationList" :key="item.id" :value="item.id">
                {{ item.name }}
            </option>
          </select>
            <div class="error-text" v-if="courseForm.errors.simulationId">{{ courseForm.errors.simulationId }}</div>
        </div>
        <div class="form-group">
            <label class="required">仿真程序路径</label>
            <input 
              type="text" 
              v-model="courseForm.simulationPath" 
              placeholder="请输入仿真程序路径"
              class="form-input"
            />
            <div class="error-text" v-if="courseForm.errors.simulationPath">{{ courseForm.errors.simulationPath }}</div>
        </div>
        </template>

        <div class="form-group">
          <label class="required">总分值</label>
          <input 
            type="number" 
            v-model="courseForm.totalScore" 
            placeholder="请输入总分值"
            class="form-input"
            min="0"
            max="100"
          />
          <div class="error-text" v-if="courseForm.errors.totalScore">{{ courseForm.errors.totalScore }}</div>
        </div>
        <div class="form-group">
          <label class="required">课程说明</label>
          <textarea 
            v-model="courseForm.description" 
            placeholder="请输入课程说明"
            class="form-textarea"
            rows="4"
          ></textarea>
          <div class="error-text" v-if="courseForm.errors.description">{{ courseForm.errors.description }}</div>
            </div>
        <div class="form-group">
          <label class="required">绑定教学资料</label>
          <div class="material-select">
            <el-select
              v-model="courseForm.materialIds"
              multiple
              filterable
              placeholder="请选择教学资料"
              class="material-select-input"
            >
              <el-option
                v-for="item in materialsList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <span class="material-option">
                  <i :class="getMaterialIcon(item.type)"></i>
                  {{ item.name }}
                </span>
              </el-option>
            </el-select>
                </div>
          <div class="error-text" v-if="courseForm.errors.materialIds">{{ courseForm.errors.materialIds }}</div>
              </div>
            </div>
      <div slot="footer" class="dialog-footer">
        <button class="btn cancel-btn" @click="closeCourseModal">取 消</button>
        <button 
          class="btn confirm-btn" 
          @click="saveCourse" 
          :disabled="!isCourseFormValid"
        >
          确 定
        </button>
      </div>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="删除课程"
      :visible.sync="showDeleteConfirmModal"
      width="400px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="dialog-body">
        <div class="confirm-message">
          <template v-if="selectedCourses.length > 1">
            确定要删除选中的 <span class="highlight danger">{{ selectedCourses.length }}</span> 个课程吗？
          </template>
          <template v-else-if="selectedCourse">
            确定要删除课程 <span class="highlight danger">{{ selectedCourse.name }}</span> 吗？
          </template>
          <template v-else>
            确定要删除选中的课程吗？
          </template>
          <div class="warning-text">此操作不可恢复，请谨慎操作！</div>
      </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <button class="btn cancel-btn" @click="closeDeleteConfirmModal">取 消</button>
        <button class="btn delete-btn" @click="deleteCourse">确定删除</button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CourseManagement',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      filterType: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 选择
      selectedCourses: [],
      
      // 课程表单
      isEdit: false,
      showCourseModal: false,
      courseForm: {
        name: '',
        type: '',
        simulationId: '', // 仿真课程序号
        simulationPath: '', // 仿真程序路径
        totalScore: '',
        description: '',
        materialIds: [], // 绑定的教学资料ID数组
        errors: {
          name: '',
          type: '',
          simulationId: '',
          simulationPath: '',
          totalScore: '',
          description: '',
          materialIds: ''
        }
      },
      
      // 删除确认
      showDeleteConfirmModal: false,
      selectedCourse: null,
      
      // 课程数据
      courses: [
        {
          id: 1,
          name: '战术训练VR课程',
          type: 'VR',
          totalScore: 100,
          description: '通过VR技术进行战术训练，提高战术意识和决策能力',
          createTime: new Date('2023-05-14 10:25:33')
        },
        {
          id: 2,
          name: '装备操作仿真课程',
          type: 'SIMULATION',
          totalScore: 100,
          description: '使用仿真系统学习装备操作流程和要领',
          createTime: new Date('2023-05-13 15:30:22')
        }
      ],
      
      // 仿真课程列表
      simulationList: [],
      // 教学资料列表
      materialsList: [],
    }
  },
  computed: {
    // 过滤后的课程列表
    filteredCourses() {
      let filtered = [...this.courses]
      
      // 关键字搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(course => 
          course.name.toLowerCase().includes(keyword)
        )
      }
      
      // 类型筛选
      if (this.filterType) {
        filtered = filtered.filter(course => course.type === this.filterType)
      }
      
      return filtered
    },
    
    // 总页数
    totalPages() {
      return Math.ceil(this.filteredCourses.length / this.pageSize)
    },
    
    // 是否全选
    isAllSelected() {
      return this.filteredCourses.length > 0 && 
             this.selectedCourses.length === this.filteredCourses.length
    },
    
    // 课程表单是否有效
    isCourseFormValid() {
      return this.courseForm.name && 
             this.courseForm.type && 
             this.courseForm.totalScore && 
             this.courseForm.description
    }
  },
  methods: {
    // 搜索课程
    searchCourses() {
      this.currentPage = 1
    },
    
    // 重置搜索
    resetSearch() {
      this.searchKeyword = ''
      this.filterType = ''
      this.currentPage = 1
      this.selectedCourses = []
    },
    
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    
    // 格式化日期
    formatDate(date) {
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    // 全选/取消全选
    toggleSelectAll(e) {
      if (e.target.checked) {
        this.selectedCourses = this.filteredCourses.map(course => course.id)
      } else {
        this.selectedCourses = []
      }
    },
    
    // ========== 新增/编辑课程相关 ==========
    openAddCourseModal() {
      this.isEdit = false
      this.courseForm = {
        name: '',
        type: '',
        simulationId: '',
        simulationPath: '',
        totalScore: '',
        description: '',
        materialIds: [],
        errors: {
          name: '',
          type: '',
          simulationId: '',
          simulationPath: '',
          totalScore: '',
          description: '',
          materialIds: ''
        }
      }
      this.showCourseModal = true
    },
    
    openEditCourseModal(course) {
      this.isEdit = true
      this.courseForm = {
        ...course,
        errors: {
          name: '',
          type: '',
          simulationId: '',
          simulationPath: '',
          totalScore: '',
          description: '',
          materialIds: ''
        }
      }
      this.showCourseModal = true
    },
    
    closeCourseModal() {
      this.showCourseModal = false
    },
    
    async saveCourse() {
      // 验证表单
      if (!this.validateCourseForm()) {
        return
      }
      
      try {
        if (this.isEdit) {
          // 更新课程
          await this.$api.updateCourse({
            id: this.courseForm.id,
            name: this.courseForm.name,
            type: this.courseForm.type,
            totalScore: this.courseForm.totalScore,
            description: this.courseForm.description,
            simulationId: this.courseForm.simulationId,
            simulationPath: this.courseForm.simulationPath,
            materialIds: this.courseForm.materialIds
          })
          
          // 更新列表中的数据
          const index = this.courses.findIndex(c => c.id === this.courseForm.id)
        if (index !== -1) {
            this.courses[index] = { ...this.courseForm }
          }
          
          this.$message.success('课程更新成功')
        } else {
          // 创建课程
          const response = await this.$api.createCourse({
            name: this.courseForm.name,
            type: this.courseForm.type,
            totalScore: this.courseForm.totalScore,
            description: this.courseForm.description,
            simulationId: this.courseForm.simulationId,
            simulationPath: this.courseForm.simulationPath,
            materialIds: this.courseForm.materialIds
          })
          
          // 添加到列表
          this.courses.unshift({
            ...response.data,
            createTime: new Date()
          })
          
          this.$message.success('课程创建成功')
        }
        
        this.closeCourseModal()
      } catch (error) {
        console.error(this.isEdit ? '更新课程失败:' : '创建课程失败:', error)
        this.$message.error(this.isEdit ? '更新课程失败，请重试' : '创建课程失败，请重试')
      }
    },
    
    validateCourseForm() {
      let isValid = true
      this.courseForm.errors = {
        name: '',
        type: '',
        simulationId: '',
        simulationPath: '',
        totalScore: '',
        description: '',
        materialIds: ''
      }
      
      if (!this.courseForm.name) {
        this.courseForm.errors.name = '请输入课程名称'
        isValid = false
      }
      
      if (!this.courseForm.type) {
        this.courseForm.errors.type = '请选择课程类型'
        isValid = false
      }
      
      // 仿真课程特有字段验证
      if (this.courseForm.type === 'SIMULATION') {
        if (!this.courseForm.simulationId) {
          this.courseForm.errors.simulationId = '请选择仿真课程序号'
          isValid = false
        }
        if (!this.courseForm.simulationPath) {
          this.courseForm.errors.simulationPath = '请输入仿真程序路径'
          isValid = false
        }
      }
      
      if (!this.courseForm.totalScore) {
        this.courseForm.errors.totalScore = '请输入总分值'
        isValid = false
      } else if (this.courseForm.totalScore < 0 || this.courseForm.totalScore > 100) {
        this.courseForm.errors.totalScore = '总分值必须在0-100之间'
        isValid = false
      }
      
      if (!this.courseForm.description) {
        this.courseForm.errors.description = '请输入课程说明'
        isValid = false
      }
      
      if (!this.courseForm.materialIds || this.courseForm.materialIds.length === 0) {
        this.courseForm.errors.materialIds = '请选择要绑定的教学资料'
        isValid = false
      }
      
      return isValid
    },
    
    // 获取仿真课程列表
    async getSimulationList() {
      try {
        const response = await this.$api.getSimulationList()
        this.simulationList = response.data
      } catch (error) {
        console.error('获取仿真课程列表失败:', error)
        this.$message.error('获取仿真课程列表失败')
      }
    },
    
    // 获取教学资料列表
    async getMaterialsList() {
      try {
        const response = await this.$api.getMaterialsList()
        this.materialsList = response.data
      } catch (error) {
        console.error('获取教学资料列表失败:', error)
        this.$message.error('获取教学资料列表失败')
      }
    },
    
    // 处理课程类型变化
    handleTypeChange() {
      // 切换类型时清空相关字段
      if (this.courseForm.type === 'VR') {
        this.courseForm.simulationId = ''
        this.courseForm.simulationPath = ''
      }
    },
    
    // 获取资料图标
    getMaterialIcon(type) {
      const iconMap = {
        'pdf': 'el-icon-document',
        'doc': 'el-icon-document-word',
        'video': 'el-icon-video-camera',
        'image': 'el-icon-picture'
      }
      return iconMap[type] || 'el-icon-document'
    },
    
    // ========== 删除课程相关 ==========
    confirmDeleteCourse(course) {
      this.selectedCourse = course
      this.selectedCourses = [course.id]
      this.showDeleteConfirmModal = true
    },
    
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false
      this.selectedCourse = null
      this.selectedCourses = []
    },
    
    batchDelete() {
      if (this.selectedCourses.length === 0) {
        this.$message.warning('请先选择要删除的课程')
        return
      }
      this.selectedCourse = null
      this.showDeleteConfirmModal = true
    },
    
    async deleteCourse() {
      try {
        await this.$api.deleteCourses(this.selectedCourses)
        
        // 从列表中移除
        this.courses = this.courses.filter(course => !this.selectedCourses.includes(course.id))
        
        this.$message.success(
          this.selectedCourses.length > 1 
            ? `已成功删除 ${this.selectedCourses.length} 个课程`
            : '课程删除成功'
        )
        
        this.closeDeleteConfirmModal()
      } catch (error) {
        console.error('删除课程失败:', error)
        this.$message.error('删除课程失败，请重试')
      }
    }
  },
  async created() {
    await Promise.all([
      this.getSimulationList(),
      this.getMaterialsList()
    ])
  }
}
</script>

<style scoped>
.course-management-container {
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

.add-course-btn {
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

.add-course-btn:hover {
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
  margin-bottom: 16px;
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

.batch-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-count {
  font-size: 14px;
  color: #606266;
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

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.type-badge.vr {
  background-color: #2b85e4;
}

.type-badge.simulation {
  background-color: #67c23a;
}

.description-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.delete-btn {
  background-color: #fff0f0;
  color: #f56c6c;
}

.delete-btn:hover {
  background-color: #fde2e2;
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

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  transition: all 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #2b85e4;
  outline: none;
}

.resource-upload {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.resource-upload:hover {
  border-color: #2b85e4;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.upload-btn i {
  font-size: 24px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.error-text {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
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

.confirm-message {
  text-align: center;
  font-size: 16px;
  color: #606266;
  padding: 20px 0;
}

.highlight {
  color: #2b85e4;
  font-weight: 500;
}

.highlight.danger {
  color: #f56c6c;
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

/* 教学资料选择器样式 */
.material-select {
  width: 100%;
}

.material-select-input {
  width: 100%;
}

.material-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.material-option i {
  font-size: 16px;
}

/* 仿真课程特有字段样式 */
.simulation-fields {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
  background-color: #fafafa;
}

.simulation-fields .form-group:last-child {
  margin-bottom: 0;
}

/* 表单分组标题 */
.form-section-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

/* 选择器中的图标 */
.el-select-dropdown__item i {
  margin-right: 8px;
  color: #909399;
}

/* 已选择的标签样式 */
.el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  }
  
.el-tag i {
  margin-right: 4px;
}

/* 提示文本样式 */
.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}
</style> 