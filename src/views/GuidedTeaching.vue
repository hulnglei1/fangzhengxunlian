<template>
  <div class="guided-teaching-container">
    <h1 class="page-title">引导教学</h1>

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
        <button class="add-btn" @click="showAddModal = true">新增引导教学</button>
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
        <h3>{{ showAddModal ? '新增' : '编辑' }}引导教学课程</h3>
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
          确定要删除引导教学课程 <strong>{{ getCourseName(courseToDelete?.courseId) }}</strong> 吗？此操作不可恢复。
        </p>
        <p v-else-if="deleteMode === 'multiple'">
          确定要删除已选中的 <strong>{{ selectedCount }}</strong> 项引导教学课程吗？此操作不可恢复。
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
  name: 'GuidedTeaching',
  data() {
    return {
      // 搜索筛选
      searchKeyword: '',
      statusFilter: '',
      // 批量选择
      selectAll: false,
      // 课程列表数据
      courses: [
        {
          id: 1,
          courseId: 1, // 对应课程管理中的装甲车操作模拟训练
          classId: 1,
          groupType: 'individual',
          startTime: '2024-03-21T09:00',
          endTime: '2024-03-21T17:00',
          duration: 120,
          maxAttempts: 3,
          notes: '请学员在规定时间内完成训练，注意按照操作规程进行。训练过程中如遇问题请及时与教员联系。',
          selected: false
        }
      ],
      filteredCourses: [],
      // 班级和学员数据
      classList: [
        {
          id: 1,
          name: '装甲一班',
          students: ['张三', '李四', '王五']
        }
      ],
      classStudents: [],
      classGroups: [],
      // 可选课程列表
      availableCourses: [
        {
          id: 1,
          name: '装甲车操作模拟训练',
          category: '仿真课程'
        }
      ],
      // 弹窗控制
      showAddModal: false,
      showEditModal: false,
      showViewModal: false,
      showDeleteConfirm: false,
      // 当前编辑/添加的课程
      currentCourse: {
        courseId: '',
        classId: '',
        groupType: 'individual', // 'individual', 'single', or 'multiple'
        startTime: '',
        endTime: '',
        duration: 120,
        maxAttempts: 3,
        unlimitedAttempts: false,
        notes: ''
      },
      // 当前查看的课程
      viewingCourse: null,
      // 删除确认
      courseToDelete: null,
      deleteMode: 'single', // 'single' or 'multiple'
      userRole: '', // 用户角色
      userId: '', // 用户ID
      groupId: '', // 组员ID
    };
  },
  computed: {
    // 是否有选中的项目
    anySelected() {
      return this.courses.some(course => course.selected);
    },
    
    // 选中的数量
    selectedCount() {
      return this.courses.filter(course => course.selected).length;
    },
    
    // 表单是否有效
    isFormValid() {
      const course = this.currentCourse;
      return course.courseId && 
             course.classId && 
             course.groupType && 
             course.startTime && 
             course.endTime && 
             course.duration > 0 && 
             (course.unlimitedAttempts || course.maxAttempts > 0);
    }
  },
  created() {
    // 获取用户角色和信息
    this.userRole = this.$store.state.user.userInfo.role || 'student';
    const userInfo = this.$store.state.user.userInfo;
    this.userId = userInfo.id;
    this.groupId = userInfo.groupId;
    
    this.loadData();
  },
  methods: {
    // 加载数据
    loadData() {
      this.loadClassList();
      this.loadCourseList();
      this.loadGuidedTeachingData();
    },
    
    // 加载班级列表
    loadClassList() {
      // 模拟从API获取班级列表
      this.classList = [
        { id: 1, name: '装甲一班', students: ['张三', '李四', '王五'] },
        { id: 2, name: '新兵连二班', code: 'XBL-02' },
        { id: 3, name: '特种作战训练班', code: 'TSC-01' }
      ];
    },
    
    // 加载课程列表
    loadCourseList() {
      // 模拟从API获取可选课程列表
      this.availableCourses = [
        {
          id: 1,
          name: '装甲车操作模拟训练',
          category: '仿真课程'
        },
        {
          id: 2,
          name: 'VR战场环境适应训练',
          categoryId: 1,
          totalScore: 90
        },
        {
          id: 3,
          name: '战术通信训练',
          categoryId: 2,
          totalScore: 85
        },
        {
          id: 4,
          name: '战场急救技能',
          categoryId: 3,
          totalScore: 80
        }
      ];
    },
    
    // 加载引导教学数据
    loadGuidedTeachingData() {
      // 合并单人课程和班组课程数据
      this.courses = [
        {
          id: 1,
          courseId: 1,
          classId: 1,
          groupType: 'individual',
          startTime: '2023-12-01T08:00',
          endTime: '2023-12-15T18:00',
          duration: 60,
          maxAttempts: 3,
          notes: '装甲车辆驾驶基础训练，请按时完成',
          selected: false
        },
        {
          id: 2,
          courseId: 2,
          classId: 2, 
          groupType: 'individual',
          startTime: '2023-11-25T10:00',
          endTime: '2023-12-10T18:00',
          duration: 90,
          maxAttempts: -1,
          notes: 'VR适应性训练，可重复练习',
          selected: false
        },
        {
          id: 3,
          courseId: 4,
          classId: 3,
          groupType: 'individual',
          startTime: '2023-12-20T09:00',
          endTime: '2024-01-10T18:00',
          duration: 45,
          maxAttempts: 2,
          notes: '战场急救技能入门课程',
          selected: false
        },
        {
          id: 4,
          courseId: 3,
          classId: 1,
          groupType: 'single',
          startTime: '2023-12-05T13:00',
          endTime: '2023-12-20T18:00',
          duration: 120,
          maxAttempts: 1,
          notes: '新兵连一班第一编组战术通信训练',
          selected: false
        },
        {
          id: 5,
          courseId: 1,
          classId: 2,
          groupType: 'multiple',
          startTime: '2023-12-10T09:00',
          endTime: '2023-12-30T18:00',
          duration: 180,
          maxAttempts: 2,
          notes: '新兵连二班多编组装甲车辆驾驶训练',
          selected: false
        },
        {
          id: 6,
          courseId: 2,
          classId: 3,
          groupType: 'multiple',
          startTime: '2024-01-05T08:00',
          endTime: '2024-01-25T18:00',
          duration: 90,
          maxAttempts: -1,
          notes: '特种作战班多编组VR战场环境训练',
          selected: false
        },
        {
          id: 7,
          courseId: 1,
          classId: 1,
          groupType: 'individual',
          startTime: '2024-03-21T09:00',
          endTime: '2024-03-21T17:00',
          duration: 120,
          maxAttempts: 3,
          notes: '请学员在规定时间内完成训练，注意按照操作规程进行。训练过程中如遇问题请及时与教员联系。',
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
          const className = this.getClassName(course.classId).toLowerCase();
          const notes = (course.notes || '').toLowerCase();
          
          return courseName.includes(keyword) || 
                 className.includes(keyword) || 
                 notes.includes(keyword);
        });
      }
      
      // 状态筛选
      if (this.statusFilter) {
        filtered = filtered.filter(course => 
          this.getCourseStatus(course) === this.statusFilter
        );
      }
      
      // 排序（默认按开始时间降序）
      filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      
      this.filteredCourses = filtered;
    },
    
    // 搜索课程
    searchCourses() {
      this.filterCourses();
    },
    
    // 切换全选
    toggleSelectAll() {
      this.courses.forEach(course => {
        course.selected = this.selectAll;
      });
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
    
    // 获取课程状态
    getCourseStatus(course) {
      const now = new Date();
      const start = new Date(course.startTime);
      const end = new Date(course.endTime);
      
      if (now < start) {
        return 'upcoming';
      } else if (now > end) {
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
      return statusMap[status] || '未知';
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
    
    // 取消添加/编辑
    cancelAddEdit() {
      this.showAddModal = false;
      this.showEditModal = false;
    },
    
    // 保存课程
    saveCourse() {
      // 处理不限次数选项
      if (this.currentCourse.unlimitedAttempts) {
        this.currentCourse.maxAttempts = -1;
      }
      
      if (this.showAddModal) {
        // 新增课程
        const newCourse = {
          ...this.currentCourse,
          id: this.courses.length > 0 ? Math.max(...this.courses.map(c => c.id)) + 1 : 1,
          selected: false
        };
        
        this.courses.push(newCourse);
      } else {
        // 编辑课程
        const index = this.courses.findIndex(c => c.id === this.currentCourse.id);
        if (index !== -1) {
          this.courses[index] = { ...this.currentCourse };
        }
      }
      
      this.filterCourses();
      this.cancelAddEdit();
    },
    
    // 确认删除课程
    confirmDeleteCourse(course) {
      this.courseToDelete = course;
      this.deleteMode = 'single';
      this.showDeleteConfirm = true;
    },
    
    // 取消删除
    cancelDelete() {
      this.showDeleteConfirm = false;
      this.courseToDelete = null;
    },
    
    // 删除课程
    deleteCourse() {
      if (this.deleteMode === 'single') {
        this.courses = this.courses.filter(c => c.id !== this.courseToDelete.id);
      } else {
        this.courses = this.courses.filter(c => !c.selected);
      }
      
      this.filterCourses();
      this.cancelDelete();
    },
    
    // 格式化日期（仅显示日期）
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 将日期格式化为input[type=datetime-local]所需的格式
    formatDateForInput(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    
    // 处理班级变更
    handleClassChange() {
      // 加载班级下的学员和编组，为了展示使用
      this.loadClassStudents(this.currentCourse.classId);
      this.loadClassGroups(this.currentCourse.classId);
    },
    
    // 加载班级学员
    loadClassStudents(classId) {
      // 模拟从API获取班级学员
      const studentsData = {
        1: [ // 新兵连一班
          { id: 3, username: 'student_wang', fullName: '王学员' },
          { id: 8, username: 'student_yang', fullName: '杨学员' },
          { id: 17, username: 'student_gao', fullName: '高学员' },
          { id: 18, username: 'student_lin', fullName: '林学员' },
          { id: 19, username: 'student_he', fullName: '何学员' }
        ],
        2: [ // 新兵连二班
          { id: 7, username: 'student_liu', fullName: '刘学员' },
          { id: 25, username: 'student_hu', fullName: '胡学员' },
          { id: 26, username: 'student_tian', fullName: '田学员' },
          { id: 27, username: 'student_xu', fullName: '徐学员' },
          { id: 28, username: 'student_deng', fullName: '邓学员' }
        ],
        3: [ // 特种作战训练班
          { id: 9, username: 'student_zhang', fullName: '张学员' },
          { id: 10, username: 'student_zhao', fullName: '赵学员' },
          { id: 11, username: 'student_qian', fullName: '钱学员' },
          { id: 12, username: 'student_sun', fullName: '孙学员' },
          { id: 13, username: 'student_li', fullName: '李学员' }
        ]
      };
      
      this.classStudents = studentsData[classId] || [];
    },
    
    // 加载班级编组
    loadClassGroups(classId) {
      // 模拟从API获取班级编组
      const groupsData = {
        1: [ // 新兵连一班
          { id: 1, name: '步兵小组', memberCount: 3 },
          { id: 2, name: '炮兵小组', memberCount: 2 }
        ],
        2: [ // 新兵连二班
          { id: 3, name: '通信小组', memberCount: 2 },
          { id: 4, name: '侦察小组', memberCount: 3 }
        ],
        3: [ // 特种作战训练班
          { id: 5, name: '突击小组', memberCount: 2 },
          { id: 6, name: '狙击小组', memberCount: 1 },
          { id: 7, name: '支援小组', memberCount: 2 }
        ]
      };
      
      this.classGroups = groupsData[classId] || [];
    },
    
    // 获取编组类型显示文本
    getGroupTypeDisplay(groupType) {
      const typeMap = {
        'individual': '单人',
        'single': '单编组',
        'multiple': '多编组'
      };
      return typeMap[groupType] || '未知';
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
}
</script>

<style scoped>
.guided-teaching-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a1a;
}

/* 功能区域样式 */
.function-area {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.search-area {
  display: flex;
  gap: 10px;
}

.search-area input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  width: 240px;
}

.search-area select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
}

.add-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #40a9ff;
}

/* 课程列表样式 */
.course-list {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  color: #5c5c5c;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 4px 8px;
  background-color: transparent;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
}

.actions button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.status-tag.upcoming {
  background-color: #faad14;
}

.status-tag.ongoing {
  background-color: #52c41a;
}

.status-tag.completed {
  background-color: #8c8c8c;
}

/* 批量操作 */
.batch-actions {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.batch-actions button {
  padding: 6px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.batch-actions button:hover {
  background-color: #ff7875;
}

/* 弹窗样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 6px 16px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 6px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  padding: 6px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group.half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="datetime-local"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input[type="radio"],
.checkbox-label input[type="checkbox"] {
  margin-right: 6px;
}

.groups-selector {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.group-item {
  margin-bottom: 8px;
}

.no-groups {
  color: #999;
  padding: 10px 0;
}

/* 查看课程样式 */
.view-group {
  margin-bottom: 15px;
}

.view-row {
  display: flex;
  gap: 15px;
}

.view-group.half {
  flex: 1;
}

.view-group label {
  font-weight: 500;
  color: #8c8c8c;
  margin-bottom: 5px;
  display: block;
}

.view-description {
  white-space: pre-line;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}

.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-tag {
  padding: 4px 12px;
  background-color: #f0f7ff;
  border-radius: 12px;
  font-size: 14px;
  color: #1890ff;
}
</style> 