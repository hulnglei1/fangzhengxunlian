<template>
  <div class="free-training-container">
    <h1 class="page-title">自由训练</h1>
    
    <!-- 搜索和功能区域 -->
    <div class="function-area">
      <div class="search-area">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入课程名称搜索"
          @input="searchCourses"
        />
        <select v-model="statusFilter" @change="filterCourses">
          <option value="">所有状态</option>
          <option value="upcoming">即将开始</option>
          <option value="ongoing">进行中</option>
          <option value="completed">已结束</option>
        </select>
        <button class="add-btn" @click="showAddModal = true">新增自由训练</button>
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="course-list">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll"></th>
            <th>课程名称</th>
            <th>班级</th>
            <th>编组类型</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>学习时长(分钟)</th>
            <th>可学习次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td><input type="checkbox" v-model="course.selected"></td>
            <td>{{ getCourseName(course.courseId) }}</td>
            <td>{{ getClassName(course.classId) }}</td>
            <td>{{ getGroupTypeDisplay(course.groupType) }}</td>
            <td>{{ formatDate(course.startTime) }}</td>
            <td>{{ formatDate(course.endTime) }}</td>
            <td>{{ course.duration }}</td>
            <td>{{ course.maxAttempts === -1 ? '不限' : course.maxAttempts }}</td>
            <td>
              <span class="status-tag" :class="getCourseStatus(course)">
                {{ getStatusText(getCourseStatus(course)) }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewCourse(course)">查看</button>
              <button @click="editCourse(course)">编辑</button>
              <button @click="confirmDeleteCourse(course)">删除</button>
              <el-button 
                v-if="userRole === 'student'"
                type="primary" 
                size="small" 
                @click="launchSimulation(course)"
              >
                启动仿真
              </el-button>
            </td>
          </tr>
          <tr v-if="filteredCourses.length === 0">
            <td colspan="10" class="no-data">暂无课程</td>
          </tr>
        </tbody>
      </table>
      <div class="batch-actions" v-if="anySelected">
        <button @click="confirmDeleteSelected">删除选中项</button>
      </div>
    </div>

    <!-- 新增/编辑课程弹窗 -->
    <div class="modal-backdrop" v-if="showAddModal || showEditModal" @click="cancelAddEdit"></div>
    <div class="modal" v-if="showAddModal || showEditModal">
      <div class="modal-header">
        <h3>{{ showAddModal ? '新增' : '编辑' }}自由训练课程</h3>
        <button class="modal-close" @click="cancelAddEdit">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>课程名称 <span class="required">*</span></label>
          <select v-model="currentCourse.courseId">
            <option value="">请选择课程</option>
            <option v-for="course in availableCourses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>班级 <span class="required">*</span></label>
          <select v-model="currentCourse.classId" @change="handleClassChange">
            <option value="">请选择班级</option>
            <option v-for="classItem in classList" :key="classItem.id" :value="classItem.id">
              {{ classItem.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>编组类型 <span class="required">*</span></label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="currentCourse.groupType" value="individual">
              <span>单人</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="currentCourse.groupType" value="single">
              <span>单编组</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="currentCourse.groupType" value="multiple">
              <span>多编组</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label>开始时间 <span class="required">*</span></label>
            <input type="datetime-local" v-model="currentCourse.startTime">
          </div>

          <div class="form-group half">
            <label>结束时间 <span class="required">*</span></label>
            <input type="datetime-local" v-model="currentCourse.endTime">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label>学习时长(分钟) <span class="required">*</span></label>
            <input type="number" v-model.number="currentCourse.duration" min="1">
          </div>

          <div class="form-group half">
            <label>可学习次数</label>
            <div class="input-with-option">
              <input 
                type="number" 
                v-model.number="currentCourse.maxAttempts" 
                min="1"
                :disabled="currentCourse.unlimitedAttempts"
              >
              <label class="checkbox-label">
                <input type="checkbox" v-model="currentCourse.unlimitedAttempts">
                <span>不限</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>备注说明</label>
          <textarea v-model="currentCourse.notes" rows="3" placeholder="请输入备注说明"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelAddEdit">取消</button>
        <button 
          class="confirm-btn" 
          @click="saveCourse" 
          :disabled="!isFormValid"
        >
          保存
        </button>
      </div>
    </div>

    <!-- 查看课程弹窗 -->
    <div class="modal-backdrop" v-if="showViewModal" @click="showViewModal = false"></div>
    <div class="modal view-modal" v-if="showViewModal">
      <div class="modal-header">
        <h3>课程详情</h3>
        <button class="modal-close" @click="showViewModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="view-group">
          <label>课程名称</label>
          <div>{{ getCourseName(viewingCourse.courseId) }}</div>
        </div>
        <div class="view-group">
          <label>班级</label>
          <div>{{ getClassName(viewingCourse.classId) }}</div>
        </div>

        <div class="view-group">
          <label>编组类型</label>
          <div>{{ getGroupTypeDisplay(viewingCourse.groupType) }}</div>
        </div>

        <div class="view-row">
          <div class="view-group half">
            <label>开始时间</label>
            <div>{{ formatDateTime(viewingCourse.startTime) }}</div>
          </div>
          <div class="view-group half">
            <label>结束时间</label>
            <div>{{ formatDateTime(viewingCourse.endTime) }}</div>
          </div>
        </div>

        <div class="view-row">
          <div class="view-group half">
            <label>学习时长</label>
            <div>{{ viewingCourse.duration }} 分钟</div>
          </div>
          <div class="view-group half">
            <label>可学习次数</label>
            <div>{{ viewingCourse.maxAttempts === -1 ? '不限' : viewingCourse.maxAttempts }}</div>
          </div>
        </div>

        <div class="view-group">
          <label>状态</label>
          <div>
            <span class="status-tag" :class="getCourseStatus(viewingCourse)">
              {{ getStatusText(getCourseStatus(viewingCourse)) }}
            </span>
          </div>
        </div>

        <div class="view-group">
          <label>备注说明</label>
          <div class="view-description">{{ viewingCourse.notes || '暂无备注' }}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="confirm-btn" @click="showViewModal = false">关闭</button>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-backdrop" v-if="showDeleteConfirm" @click="cancelDelete"></div>
    <div class="modal delete-confirm-modal" v-if="showDeleteConfirm">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="modal-close" @click="cancelDelete">&times;</button>
      </div>
      <div class="modal-body">
        <p v-if="deleteMode === 'single'">
          确定要删除自由训练课程 <strong>{{ getCourseName(courseToDelete?.courseId) }}</strong> 吗？此操作不可恢复。
        </p>
        <p v-else-if="deleteMode === 'multiple'">
          确定要删除已选中的 <strong>{{ selectedCount }}</strong> 项自由训练课程吗？此操作不可恢复。
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDelete">取消</button>
        <button class="delete-btn" @click="deleteCourse">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FreeTraining',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      statusFilter: '',
      
      // 课程列表
      courses: [],
      filteredCourses: [],
      selectAll: false,
      
      // 弹窗控制
      showAddModal: false,
      showEditModal: false,
      showViewModal: false,
      showDeleteConfirm: false,
      
      // 当前编辑/查看的课程
      currentCourse: this.getEmptyCourse(),
      viewingCourse: {},
      courseToDelete: null,
      deleteMode: 'single', // 'single' 或 'multiple'
      
      // 可用课程列表
      availableCourses: [
        { id: 'ft001', name: '装甲车辆驾驶训练', type: 'freeTraining' },
        { id: 'ft002', name: '战场通信训练', type: 'freeTraining' },
        { id: 'ft003', name: '战术协同训练', type: 'freeTraining' },
        { id: 'ft004', name: '战场急救技能', type: 'freeTraining' },
        { id: 'ft005', name: 'VR战场环境适应训练', type: 'freeTraining' }
      ],
      
      // 班级列表
      classList: [
        { id: 'class001', name: '新兵连一班' },
        { id: 'class002', name: '新兵连二班' },
        { id: 'class003', name: '特种作战班' },
        { id: 'class004', name: '通信技术班' }
      ],
      userRole: '', // 用户角色
      userId: '', // 用户ID
      groupId: '', // 组员ID
    };
  },
  computed: {
    // 表单验证
    isFormValid() {
      return (
        this.currentCourse.courseId &&
        this.currentCourse.classId &&
        this.currentCourse.groupType &&
        this.currentCourse.startTime &&
        this.currentCourse.endTime &&
        this.currentCourse.duration > 0 &&
        (this.currentCourse.unlimitedAttempts || this.currentCourse.maxAttempts > 0) &&
        new Date(this.currentCourse.startTime) < new Date(this.currentCourse.endTime)
      );
    },
    
    // 是否有选中项
    anySelected() {
      return this.courses.some(course => course.selected);
    },
    
    // 选中项数量
    selectedCount() {
      return this.courses.filter(course => course.selected).length;
    }
  },
  created() {
    // 获取用户角色和信息
    this.userRole = this.$store.state.user.role;
    const userInfo = this.$store.state.user.userInfo;
    this.userId = userInfo.id;
    this.groupId = userInfo.groupId;
    
    this.loadCourses();
  },
  methods: {
    // 加载课程列表
    loadCourses() {
      // 模拟从API获取课程数据
      this.courses = [
        {
          id: 'ftc001',
          courseId: 'ft001',
          classId: 'class001',
          groupType: 'individual',
          startTime: '2023-12-10T08:00',
          endTime: '2023-12-20T18:00',
          duration: 60,
          maxAttempts: 3,
          notes: '单人装甲车辆驾驶训练课程',
          selected: false
        },
        {
          id: 'ftc002',
          courseId: 'ft002',
          classId: 'class003',
          groupType: 'single',
          startTime: '2023-12-15T09:00',
          endTime: '2023-12-25T17:00',
          duration: 90,
          maxAttempts: -1,
          notes: '单编组战场通信训练',
          selected: false
        },
        {
          id: 'ftc003',
          courseId: 'ft003',
          classId: 'class004',
          groupType: 'multiple',
          startTime: '2023-12-05T10:00',
          endTime: '2023-12-15T16:00',
          duration: 120,
          maxAttempts: 5,
          notes: '多编组战术协同训练',
          selected: false
        }
      ];
      
      this.filterCourses();
    },
    
    // 过滤课程列表
    filterCourses() {
      let filtered = [...this.courses];
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(course => {
          const courseName = this.getCourseName(course.courseId).toLowerCase();
          return courseName.includes(keyword);
        });
      }
      
      // 状态筛选
      if (this.statusFilter) {
        filtered = filtered.filter(course => this.getCourseStatus(course) === this.statusFilter);
      }
      
      this.filteredCourses = filtered;
    },
    
    // 搜索课程
    searchCourses() {
      this.filterCourses();
    },
    
    // 获取课程名称
    getCourseName(courseId) {
      const course = this.availableCourses.find(c => c.id === courseId);
      return course ? course.name : '未知课程';
    },
    
    // 获取班级名称
    getClassName(classId) {
      const classItem = this.classList.find(c => c.id === classId);
      return classItem ? classItem.name : '未知班级';
    },
    
    // 获取编组类型显示文本
    getGroupTypeDisplay(type) {
      const typeMap = {
        individual: '单人',
        single: '单编组',
        multiple: '多编组'
      };
      return typeMap[type] || '未知类型';
    },
    
    // 获取课程状态
    getCourseStatus(course) {
      const now = new Date();
      const startTime = new Date(course.startTime);
      const endTime = new Date(course.endTime);
      
      if (now < startTime) {
        return 'upcoming';
      } else if (now > endTime) {
        return 'completed';
      } else {
        return 'ongoing';
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        upcoming: '即将开始',
        ongoing: '进行中',
        completed: '已结束'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      const date = new Date(dateString);
      return `${this.formatDate(dateString)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 切换全选
    toggleSelectAll() {
      this.courses.forEach(course => {
        course.selected = this.selectAll;
      });
    },
    
    // 查看课程
    viewCourse(course) {
      this.viewingCourse = { ...course };
      this.showViewModal = true;
    },
    
    // 编辑课程
    editCourse(course) {
      this.currentCourse = { 
        ...course,
        unlimitedAttempts: course.maxAttempts === -1
      };
      this.showEditModal = true;
    },
    
    // 确认删除课程
    confirmDeleteCourse(course) {
      this.courseToDelete = course;
      this.deleteMode = 'single';
      this.showDeleteConfirm = true;
    },
    
    // 确认删除选中项
    confirmDeleteSelected() {
      this.deleteMode = 'multiple';
      this.showDeleteConfirm = true;
    },
    
    // 删除课程
    deleteCourse() {
      if (this.deleteMode === 'single' && this.courseToDelete) {
        // 删除单个课程
        this.courses = this.courses.filter(course => course.id !== this.courseToDelete.id);
      } else if (this.deleteMode === 'multiple') {
        // 删除多个课程
        this.courses = this.courses.filter(course => !course.selected);
      }
      
      this.filterCourses();
      this.cancelDelete();
    },
    
    // 取消删除
    cancelDelete() {
      this.showDeleteConfirm = false;
      this.courseToDelete = null;
    },
    
    // 保存课程
    saveCourse() {
      const courseData = { ...this.currentCourse };
      
      // 处理不限次数的情况
      if (courseData.unlimitedAttempts) {
        courseData.maxAttempts = -1;
      }
      delete courseData.unlimitedAttempts;
      
      if (this.showAddModal) {
        // 新增课程
        courseData.id = 'ftc' + Date.now().toString().slice(-6);
        courseData.selected = false;
        this.courses.push(courseData);
      } else {
        // 编辑课程
        const index = this.courses.findIndex(c => c.id === courseData.id);
        if (index !== -1) {
          this.courses[index] = courseData;
        }
      }
      
      this.filterCourses();
      this.cancelAddEdit();
    },
    
    // 取消新增/编辑
    cancelAddEdit() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.currentCourse = this.getEmptyCourse();
    },
    
    // 班级变更处理
    handleClassChange() {
      // 可以在这里处理班级变更后的逻辑，比如获取班级下的编组信息等
    },
    
    // 获取空课程对象
    getEmptyCourse() {
      return {
        id: '',
        courseId: '',
        classId: '',
        groupType: 'individual',
        startTime: '',
        endTime: '',
        duration: 60,
        maxAttempts: 3,
        unlimitedAttempts: false,
        notes: ''
      };
    },
    
    // 启动仿真程序
    async launchSimulation(course) {
      try {
        // 获取当前用户信息
        const userInfo = this.$store.state.user.userInfo;
        
        // 构建启动参数
        const params = {
          courseId: course.id,
          studentId: userInfo.id,
          groupId: userInfo.groupId || null
        };
        
        // 调用后端API启动仿真程序
        const response = await this.$api.post('/simulation/launch', params);
        
        if (response.success) {
          this.$message.success('仿真程序启动成功');
        } else {
          this.$message.error('仿真程序启动失败');
        }
      } catch (error) {
        console.error('启动仿真程序失败:', error);
        this.$message.error('启动仿真程序失败，请稍后重试');
      }
    }
  }
};
</script>

<style scoped>
.free-training-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a1a;
}

/* 功能区域 */
.function-area {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-area {
  display: flex;
  gap: 10px;
}

.search-area input {
  width: 250px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-area select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
}

.add-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* 课程列表 */
.course-list {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.status-tag.upcoming {
  background-color: #1890ff;
}

.status-tag.ongoing {
  background-color: #52c41a;
}

.status-tag.completed {
  background-color: #8c8c8c;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 12px;
}

.actions button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.no-data {
  text-align: center;
  color: #8c8c8c;
  padding: 30px 0;
}

.batch-actions {
  padding: 12px 16px;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

/* 弹窗 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 101;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #8c8c8c;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.modal-footer {
  padding: 10px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
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
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
  margin-bottom: 0;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 6px;
  width: auto;
}

.input-with-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-option input[type="number"] {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  white-space: nowrap;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 6px;
  width: auto;
}

/* 按钮样式 */
.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.delete-btn {
  padding: 8px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 查看详情样式 */
.view-group {
  margin-bottom: 16px;
}

.view-group label {
  display: block;
  margin-bottom: 4px;
  color: #8c8c8c;
  font-size: 14px;
}

.view-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.view-group.half {
  flex: 1;
  margin-bottom: 0;
}

.view-description {
  white-space: pre-wrap;
  color: #595959;
}

.required {
  color: #ff4d4f;
}
</style> 