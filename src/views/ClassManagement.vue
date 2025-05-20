<template>
  <div class="class-management-container">
    <h1 class="page-title">班级管理</h1>

    <!-- 搜索和操作栏 -->
    <div class="action-bar">
      <div class="search-area">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="请输入班级名称/代号搜索" 
          class="search-input" 
          @keyup.enter="searchClasses"
        />
        <select v-model="filterInstructorId" class="filter-select">
          <option value="">全部教员</option>
          <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
            {{ instructor.fullName }}
          </option>
        </select>
        <button class="search-btn" @click="searchClasses">查询</button>
        <button class="reset-btn" @click="resetSearch">重置</button>
      </div>
      <div class="action-btns">
        <button class="create-btn" @click="openCreateModal">创建班级</button>
      </div>
    </div>

    <!-- 班级列表 -->
    <div class="class-list">
      <table class="class-table">
        <thead>
          <tr>
            <th width="5%">序号</th>
            <th width="15%">班级名称</th>
            <th width="10%">班级代号</th>
            <th width="15%">教员</th>
            <th width="15%">学员数量</th>
            <th width="15%">创建时间</th>
            <th width="25%">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(classItem, index) in filteredClasses" :key="classItem.id">
            <td>{{ index + 1 }}</td>
            <td>{{ classItem.name }}</td>
            <td>{{ classItem.code }}</td>
            <td>
              <div v-if="classItem.instructors.length > 0">
                <span 
                  v-for="(instructor, idx) in classItem.instructors" 
                  :key="instructor.id"
                  class="instructor-tag"
                >
                  {{ instructor.fullName }}{{ idx < classItem.instructors.length - 1 ? '，' : '' }}
                </span>
              </div>
              <span v-else class="empty-text">未分配</span>
            </td>
            <td>{{ classItem.students.length }} 人</td>
            <td>{{ formatDate(classItem.createdAt) }}</td>
            <td class="actions-cell">
              <button class="view-btn" @click="viewClassDetails(classItem)">查看详情</button>
              <button class="edit-btn" @click="openEditModal(classItem)">修改</button>
              <button class="delete-btn" @click="confirmDelete(classItem)">删除</button>
            </td>
          </tr>
          <tr v-if="filteredClasses.length === 0">
            <td colspan="7" class="empty-data">暂无班级数据</td>
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

    <!-- 班级详情弹窗 -->
    <div class="modal-backdrop" v-if="showDetailModal" @click="closeDetailModal"></div>
    <div class="modal detail-modal" v-if="showDetailModal">
      <div class="modal-header">
        <h3>班级详情：{{ detailClass.name }} ({{ detailClass.code }})</h3>
        <button class="modal-close" @click="closeDetailModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-section">
          <div class="detail-item">
            <div class="detail-label">班级名称</div>
            <div class="detail-value">{{ detailClass.name }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">班级代号</div>
            <div class="detail-value">{{ detailClass.code }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">创建时间</div>
            <div class="detail-value">{{ formatDate(detailClass.createdAt) }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">班级描述</div>
            <div class="detail-value description">{{ detailClass.description }}</div>
          </div>
        </div>

        <!-- 教员管理 -->
        <div class="detail-section">
          <div class="section-header">
            <h4>教员管理</h4>
            <button class="add-btn" @click="openAddInstructorModal">添加教员</button>
          </div>
          <div class="member-list" v-if="detailClass.instructors.length > 0">
            <div class="member-item" v-for="instructor in detailClass.instructors" :key="instructor.id">
              <div class="member-info">
                <div class="member-name">{{ instructor.fullName }}</div>
                <div class="member-username">{{ instructor.username }}</div>
              </div>
              <button class="remove-btn" @click="confirmRemoveInstructor(instructor)">移除</button>
            </div>
          </div>
          <div class="empty-members" v-else>暂无教员，请添加教员</div>
        </div>

        <!-- 学员管理 -->
        <div class="detail-section">
          <div class="section-header">
            <h4>学员管理</h4>
            <button class="add-btn" @click="openAddStudentModal">添加学员</button>
          </div>
          <div class="member-list" v-if="detailClass.students.length > 0">
            <div class="member-item" v-for="student in detailClass.students" :key="student.id">
              <div class="member-info">
                <div class="member-name">{{ student.fullName }}</div>
                <div class="member-username">{{ student.username }}</div>
              </div>
              <button class="remove-btn" @click="confirmRemoveStudent(student)">移除</button>
            </div>
          </div>
          <div class="empty-members" v-else>暂无学员，请添加学员</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="close-btn" @click="closeDetailModal">关闭</button>
      </div>
    </div>

    <!-- 创建/编辑班级弹窗 -->
    <div class="modal-backdrop" v-if="showEditModal" @click="closeEditModal"></div>
    <div class="modal" v-if="showEditModal">
      <div class="modal-header">
        <h3>{{ isCreating ? '创建班级' : '修改班级' }}</h3>
        <button class="modal-close" @click="closeEditModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>班级名称</label>
          <input type="text" v-model="classForm.name" placeholder="请输入班级名称" />
          <p class="error-text" v-if="formErrors.name">{{ formErrors.name }}</p>
        </div>
        <div class="form-group">
          <label>班级代号</label>
          <input type="text" v-model="classForm.code" placeholder="请输入班级代号" />
          <p class="error-text" v-if="formErrors.code">{{ formErrors.code }}</p>
        </div>
        <div class="form-group">
          <label>班级描述</label>
          <textarea 
            v-model="classForm.description" 
            placeholder="请输入班级描述"
            rows="3"
          ></textarea>
          <p class="error-text" v-if="formErrors.description">{{ formErrors.description }}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeEditModal">取消</button>
        <button class="save-btn" @click="saveClass">保存</button>
      </div>
    </div>

    <!-- 添加教员弹窗 -->
    <div class="modal-backdrop" v-if="showAddInstructorModal" @click="closeAddInstructorModal"></div>
    <div class="modal" v-if="showAddInstructorModal">
      <div class="modal-header">
        <h3>添加教员</h3>
        <button class="modal-close" @click="closeAddInstructorModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="search-input-group">
          <input 
            type="text" 
            v-model="instructorSearchKeyword" 
            placeholder="请输入教员账号/姓名搜索" 
            class="modal-search-input" 
            @input="searchAvailableInstructors"
          />
        </div>
        <div class="user-select-list">
          <div 
            v-for="instructor in filteredAvailableInstructors" 
            :key="instructor.id"
            class="user-select-item"
            :class="{ 'selected': selectedInstructors.includes(instructor.id) }"
            @click="toggleInstructorSelection(instructor.id)"
          >
            <div class="user-info">
              <div class="user-name">{{ instructor.fullName }}</div>
              <div class="user-username">{{ instructor.username }}</div>
              <div class="user-department">{{ instructor.department }}</div>
            </div>
            <div class="checkbox">
              <span v-if="selectedInstructors.includes(instructor.id)">✓</span>
            </div>
          </div>
          <div v-if="filteredAvailableInstructors.length === 0" class="empty-users">
            没有可添加的教员或没有符合搜索条件的教员
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="selection-count" v-if="selectedInstructors.length > 0">
          已选择 {{ selectedInstructors.length }} 名教员
        </div>
        <div class="buttons">
          <button class="cancel-btn" @click="closeAddInstructorModal">取消</button>
          <button 
            class="save-btn" 
            @click="addInstructorsToClass" 
            :disabled="selectedInstructors.length === 0"
          >
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- 添加学员弹窗 -->
    <div class="modal-backdrop" v-if="showAddStudentModal" @click="closeAddStudentModal"></div>
    <div class="modal" v-if="showAddStudentModal">
      <div class="modal-header">
        <h3>添加学员</h3>
        <button class="modal-close" @click="closeAddStudentModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="search-input-group">
          <input 
            type="text" 
            v-model="studentSearchKeyword" 
            placeholder="请输入学员账号/姓名搜索" 
            class="modal-search-input" 
            @input="searchAvailableStudents"
          />
        </div>
        <div class="user-select-list">
          <div 
            v-for="student in filteredAvailableStudents" 
            :key="student.id"
            class="user-select-item"
            :class="{ 'selected': selectedStudents.includes(student.id) }"
            @click="toggleStudentSelection(student.id)"
          >
            <div class="user-info">
              <div class="user-name">{{ student.fullName }}</div>
              <div class="user-username">{{ student.username }}</div>
              <div class="user-department">{{ student.department }}</div>
            </div>
            <div class="checkbox">
              <span v-if="selectedStudents.includes(student.id)">✓</span>
            </div>
          </div>
          <div v-if="filteredAvailableStudents.length === 0" class="empty-users">
            没有可添加的学员或没有符合搜索条件的学员
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="selection-count" v-if="selectedStudents.length > 0">
          已选择 {{ selectedStudents.length }} 名学员
        </div>
        <div class="buttons">
          <button class="cancel-btn" @click="closeAddStudentModal">取消</button>
          <button 
            class="save-btn" 
            @click="addStudentsToClass" 
            :disabled="selectedStudents.length === 0"
          >
            添加
          </button>
        </div>
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
          确定要删除班级 <span class="highlight">{{ pendingDeleteClass?.name }}</span> 吗？<br>
          此操作将同时移除该班级中的所有学员和教员关联，但不会删除用户账号。此操作无法撤销。
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDelete">取消</button>
        <button class="delete-confirm-btn" @click="deleteClass">确认删除</button>
      </div>
    </div>

    <!-- 移除成员确认弹窗 -->
    <div class="modal-backdrop" v-if="showRemoveConfirm" @click="cancelRemoveMember"></div>
    <div class="modal remove-modal" v-if="showRemoveConfirm">
      <div class="modal-header">
        <h3>确认移除{{ isRemovingInstructor ? '教员' : '学员' }}</h3>
        <button class="modal-close" @click="cancelRemoveMember">&times;</button>
      </div>
      <div class="modal-body">
        <p class="confirm-text">
          确定要将{{ isRemovingInstructor ? '教员' : '学员' }}
          <span class="highlight">{{ pendingRemoveMember?.fullName }}</span>
          从班级 <span class="highlight">{{ detailClass.name }}</span> 中移除吗？
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelRemoveMember">取消</button>
        <button class="delete-confirm-btn" @click="removeMember">确认移除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClassManagement',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      filterInstructorId: '',
      
      // 分页
      currentPage: 1,
      pageSize: 5,
      
      // 班级详情
      showDetailModal: false,
      detailClass: {
        id: null,
        name: '',
        code: '',
        description: '',
        createdAt: null,
        instructors: [],
        students: []
      },
      
      // 创建/编辑班级
      showEditModal: false,
      isCreating: false,
      classForm: {
        id: null,
        name: '',
        code: '',
        description: '',
        instructors: [],
        students: []
      },
      formErrors: {
        name: '',
        code: '',
        description: ''
      },
      
      // 添加教员
      showAddInstructorModal: false,
      instructorSearchKeyword: '',
      selectedInstructors: [],
      
      // 添加学员
      showAddStudentModal: false,
      studentSearchKeyword: '',
      selectedStudents: [],
      
      // 删除确认
      showDeleteConfirm: false,
      pendingDeleteClass: null,
      
      // 移除成员确认
      showRemoveConfirm: false,
      pendingRemoveMember: null,
      isRemovingInstructor: false,
      
      // 班级数据
      classes: [
        {
          id: 1,
          name: '新兵连一班',
          code: 'XBL-01',
          description: '新入伍士兵基础训练班级，主要进行军事基础、体能训练和队列训练。',
          createdAt: new Date('2023-01-10'),
          instructors: [
            {
              id: 2,
              username: 'instructor_li',
              fullName: '李教官',
              department: '训练教导队'
            }
          ],
          students: [
            {
              id: 3,
              username: 'student_wang',
              fullName: '王学员',
              department: '新兵连一班'
            },
            {
              id: 8,
              username: 'student_yang',
              fullName: '杨学员',
              department: '新兵连一班'
            },
            {
              id: 17,
              username: 'student_gao',
              fullName: '高学员',
              department: '新兵连一班'
            },
            {
              id: 18,
              username: 'student_lin',
              fullName: '林学员',
              department: '新兵连一班'
            },
            {
              id: 19,
              username: 'student_he',
              fullName: '何学员',
              department: '新兵连一班'
            },
            {
              id: 20,
              username: 'student_ma',
              fullName: '马学员',
              department: '新兵连一班'
            },
            {
              id: 21,
              username: 'student_luo',
              fullName: '罗学员',
              department: '新兵连一班'
            },
            {
              id: 22,
              username: 'student_peng',
              fullName: '彭学员',
              department: '新兵连一班'
            },
            {
              id: 23,
              username: 'student_chen',
              fullName: '陈学员',
              department: '新兵连一班'
            },
            {
              id: 24,
              username: 'student_xie',
              fullName: '谢学员',
              department: '新兵连一班'
            }
          ]
        },
        {
          id: 2,
          name: '新兵连二班',
          code: 'XBL-02',
          description: '新入伍士兵基础训练班级，主要进行军事理论、战术训练和武器使用。',
          createdAt: new Date('2023-01-12'),
          instructors: [
            {
              id: 6,
              username: 'instructor_sun',
              fullName: '孙教官',
              department: '特战训练队'
            }
          ],
          students: [
            {
              id: 7,
              username: 'student_liu',
              fullName: '刘学员',
              department: '新兵连二班'
            },
            {
              id: 25,
              username: 'student_hu',
              fullName: '胡学员',
              department: '新兵连二班'
            },
            {
              id: 26,
              username: 'student_tian',
              fullName: '田学员',
              department: '新兵连二班'
            },
            {
              id: 27,
              username: 'student_xu',
              fullName: '徐学员',
              department: '新兵连二班'
            },
            {
              id: 28,
              username: 'student_deng',
              fullName: '邓学员',
              department: '新兵连二班'
            },
            {
              id: 29,
              username: 'student_cao',
              fullName: '曹学员',
              department: '新兵连二班'
            },
            {
              id: 30,
              username: 'student_feng',
              fullName: '冯学员',
              department: '新兵连二班'
            },
            {
              id: 31,
              username: 'student_tang',
              fullName: '唐学员',
              department: '新兵连二班'
            },
            {
              id: 32,
              username: 'student_pan',
              fullName: '潘学员',
              department: '新兵连二班'
            },
            {
              id: 33,
              username: 'student_liang',
              fullName: '梁学员',
              department: '新兵连二班'
            }
          ]
        },
        {
          id: 3,
          name: '特种作战训练班',
          code: 'TSC-01',
          description: '特种作战人员进阶训练班级，着重培训特种作战技能和战术协同。',
          createdAt: new Date('2023-02-05'),
          instructors: [
            {
              id: 6,
              username: 'instructor_sun',
              fullName: '孙教官',
              department: '特战训练队'
            }
          ],
          students: [
            {
              id: 9,
              username: 'student_zhang',
              fullName: '张学员',
              department: '特种作战训练班'
            },
            {
              id: 10,
              username: 'student_zhao',
              fullName: '赵学员',
              department: '特种作战训练班'
            },
            {
              id: 11,
              username: 'student_qian',
              fullName: '钱学员',
              department: '特种作战训练班'
            },
            {
              id: 12,
              username: 'student_sun',
              fullName: '孙学员',
              department: '特种作战训练班'
            },
            {
              id: 13,
              username: 'student_li',
              fullName: '李学员',
              department: '特种作战训练班'
            },
            {
              id: 14,
              username: 'student_zhou',
              fullName: '周学员',
              department: '特种作战训练班'
            },
            {
              id: 15,
              username: 'student_wu',
              fullName: '吴学员',
              department: '特种作战训练班'
            },
            {
              id: 16,
              username: 'student_zheng',
              fullName: '郑学员',
              department: '特种作战训练班'
            }
          ]
        }
      ],
      
      // 可选教员数据
      instructors: [
        {
          id: 2,
          username: 'instructor_li',
          fullName: '李教官',
          roleId: 2,
          department: '训练教导队'
        },
        {
          id: 6,
          username: 'instructor_sun',
          fullName: '孙教官',
          roleId: 2,
          department: '特战训练队'
        },
        {
          id: 4,
          username: 'supervisor_zhao',
          fullName: '赵督导',
          roleId: 4,
          department: '训练督导组'
        }
      ],
      
      // 可选学员数据
      students: [
        {
          id: 3,
          username: 'student_wang',
          fullName: '王学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 7,
          username: 'student_liu',
          fullName: '刘学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 8,
          username: 'student_yang',
          fullName: '杨学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 9,
          username: 'student_zhang',
          fullName: '张学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 10,
          username: 'student_zhao',
          fullName: '赵学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 11,
          username: 'student_qian',
          fullName: '钱学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 12,
          username: 'student_sun',
          fullName: '孙学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 13,
          username: 'student_li',
          fullName: '李学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 14,
          username: 'student_zhou',
          fullName: '周学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 15,
          username: 'student_wu',
          fullName: '吴学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 16,
          username: 'student_zheng',
          fullName: '郑学员',
          roleId: 3,
          department: '特种作战训练班'
        },
        {
          id: 17,
          username: 'student_gao',
          fullName: '高学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 18,
          username: 'student_lin',
          fullName: '林学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 19,
          username: 'student_he',
          fullName: '何学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 20,
          username: 'student_ma',
          fullName: '马学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 21,
          username: 'student_luo',
          fullName: '罗学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 22,
          username: 'student_peng',
          fullName: '彭学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 23,
          username: 'student_chen',
          fullName: '陈学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 24,
          username: 'student_xie',
          fullName: '谢学员',
          roleId: 3,
          department: '新兵连一班'
        },
        {
          id: 25,
          username: 'student_hu',
          fullName: '胡学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 26,
          username: 'student_tian',
          fullName: '田学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 27,
          username: 'student_xu',
          fullName: '徐学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 28,
          username: 'student_deng',
          fullName: '邓学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 29,
          username: 'student_cao',
          fullName: '曹学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 30,
          username: 'student_feng',
          fullName: '冯学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 31,
          username: 'student_tang',
          fullName: '唐学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 32,
          username: 'student_pan',
          fullName: '潘学员',
          roleId: 3,
          department: '新兵连二班'
        },
        {
          id: 33,
          username: 'student_liang',
          fullName: '梁学员',
          roleId: 3,
          department: '新兵连二班'
        }
      ]
    }
  },
  computed: {
    // 过滤后的班级列表
    filteredClasses() {
      let filtered = [...this.classes];
      
      // 应用关键字搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(classItem => 
          classItem.name.toLowerCase().includes(keyword) || 
          classItem.code.toLowerCase().includes(keyword)
        );
      }
      
      // 应用教员筛选
      if (this.filterInstructorId) {
        const instructorId = parseInt(this.filterInstructorId);
        filtered = filtered.filter(classItem => 
          classItem.instructors.some(instructor => instructor.id === instructorId)
        );
      }
      
      // 分页
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      
      return filtered.slice(startIndex, endIndex);
    },
    
    // 计算总页数
    totalPages() {
      let filtered = [...this.classes];
      
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(classItem => 
          classItem.name.toLowerCase().includes(keyword) || 
          classItem.code.toLowerCase().includes(keyword)
        );
      }
      
      if (this.filterInstructorId) {
        const instructorId = parseInt(this.filterInstructorId);
        filtered = filtered.filter(classItem => 
          classItem.instructors.some(instructor => instructor.id === instructorId)
        );
      }
      
      return Math.ceil(filtered.length / this.pageSize) || 1;
    },
    
    // 过滤后的可用教员
    filteredAvailableInstructors() {
      // 获取当前班级已有的教员ID列表
      const existingInstructorIds = this.detailClass.instructors.map(i => i.id);
      
      // 过滤出未在当前班级的教员
      let available = this.instructors.filter(instructor => 
        !existingInstructorIds.includes(instructor.id)
      );
      
      // 应用搜索过滤
      if (this.instructorSearchKeyword) {
        const keyword = this.instructorSearchKeyword.toLowerCase();
        available = available.filter(instructor => 
          instructor.username.toLowerCase().includes(keyword) || 
          instructor.fullName.toLowerCase().includes(keyword)
        );
      }
      
      return available;
    },
    
    // 过滤后的可用学员
    filteredAvailableStudents() {
      // 获取当前班级已有的学员ID列表
      const existingStudentIds = this.detailClass.students.map(s => s.id);
      
      // 过滤出未在当前班级的学员
      let available = this.students.filter(student => 
        !existingStudentIds.includes(student.id)
      );
      
      // 应用搜索过滤
      if (this.studentSearchKeyword) {
        const keyword = this.studentSearchKeyword.toLowerCase();
        available = available.filter(student => 
          student.username.toLowerCase().includes(keyword) || 
          student.fullName.toLowerCase().includes(keyword)
        );
      }
      
      return available;
    }
  },
  methods: {
    // 查询班级
    searchClasses() {
      this.currentPage = 1;
    },
    
    // 重置搜索
    resetSearch() {
      this.searchKeyword = '';
      this.filterInstructorId = '';
      this.currentPage = 1;
    },
    
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
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
    
    // ========== 班级详情 ==========
    // 查看班级详情
    viewClassDetails(classItem) {
      this.detailClass = JSON.parse(JSON.stringify(classItem)); // 深拷贝
      this.showDetailModal = true;
    },
    
    // 关闭班级详情弹窗
    closeDetailModal() {
      this.showDetailModal = false;
      this.detailClass = {
        id: null,
        name: '',
        code: '',
        description: '',
        createdAt: null,
        instructors: [],
        students: []
      };
    },
    
    // ========== 创建/编辑班级 ==========
    // 打开创建班级弹窗
    openCreateModal() {
      this.isCreating = true;
      this.classForm = {
        id: null,
        name: '',
        code: '',
        description: '',
        instructors: [],
        students: []
      };
      this.resetFormErrors();
      this.showEditModal = true;
    },
    
    // 打开编辑班级弹窗
    openEditModal(classItem) {
      this.isCreating = false;
      this.classForm = {
        id: classItem.id,
        name: classItem.name,
        code: classItem.code,
        description: classItem.description,
        instructors: [...classItem.instructors],
        students: [...classItem.students]
      };
      this.resetFormErrors();
      this.showEditModal = true;
    },
    
    // 关闭创建/编辑班级弹窗
    closeEditModal() {
      this.showEditModal = false;
      this.classForm = {
        id: null,
        name: '',
        code: '',
        description: '',
        instructors: [],
        students: []
      };
    },
    
    // 验证班级表单
    validateClassForm() {
      let isValid = true;
      this.resetFormErrors();
      
      // 验证班级名称
      if (!this.classForm.name.trim()) {
        this.formErrors.name = '请输入班级名称';
        isValid = false;
      }
      
      // 验证班级代号
      if (!this.classForm.code.trim()) {
        this.formErrors.code = '请输入班级代号';
        isValid = false;
      } else if (this.isCreating && this.classes.some(c => c.code === this.classForm.code.trim())) {
        this.formErrors.code = '班级代号已存在';
        isValid = false;
      }
      
      return isValid;
    },
    
    // 重置表单错误
    resetFormErrors() {
      this.formErrors = {
        name: '',
        code: '',
        description: ''
      };
    },
    
    // 保存班级
    saveClass() {
      if (!this.validateClassForm()) {
        return;
      }
      
      if (this.isCreating) {
        // 创建新班级
        const newId = Math.max(...this.classes.map(c => c.id), 0) + 1;
        const newClass = {
          ...this.classForm,
          id: newId,
          createdAt: new Date()
        };
        this.classes.push(newClass);
        alert(`班级 ${newClass.name} 创建成功！`);
      } else {
        // 更新现有班级
        const index = this.classes.findIndex(c => c.id === this.classForm.id);
        if (index !== -1) {
          const updatedClass = {
            ...this.classes[index],
            name: this.classForm.name,
            code: this.classForm.code,
            description: this.classForm.description
          };
          this.classes.splice(index, 1, updatedClass);
          alert(`班级 ${updatedClass.name} 更新成功！`);
        }
      }
      
      this.closeEditModal();
    },
    
    // ========== 删除班级 ==========
    // 确认删除班级
    confirmDelete(classItem) {
      this.pendingDeleteClass = classItem;
      this.showDeleteConfirm = true;
    },
    
    // 取消删除
    cancelDelete() {
      this.pendingDeleteClass = null;
      this.showDeleteConfirm = false;
    },
    
    // 删除班级
    deleteClass() {
      const index = this.classes.findIndex(c => c.id === this.pendingDeleteClass.id);
      if (index !== -1) {
        this.classes.splice(index, 1);
        alert(`班级 ${this.pendingDeleteClass.name} 已删除！`);
      }
      
      this.cancelDelete();
      
      // 如果当前页没有数据，则返回前一页
      if (this.filteredClasses.length === 0 && this.currentPage > 1) {
        this.currentPage--;
      }
    },
    
    // ========== 添加教员 ==========
    // 打开添加教员弹窗
    openAddInstructorModal() {
      this.instructorSearchKeyword = '';
      this.selectedInstructors = [];
      this.showAddInstructorModal = true;
    },
    
    // 关闭添加教员弹窗
    closeAddInstructorModal() {
      this.showAddInstructorModal = false;
      this.instructorSearchKeyword = '';
      this.selectedInstructors = [];
    },
    
    // 搜索可用教员
    searchAvailableInstructors() {
      // 通过计算属性自动过滤
    },
    
    // 切换教员选择
    toggleInstructorSelection(instructorId) {
      const index = this.selectedInstructors.indexOf(instructorId);
      if (index === -1) {
        this.selectedInstructors.push(instructorId);
      } else {
        this.selectedInstructors.splice(index, 1);
      }
    },
    
    // 添加教员到班级
    addInstructorsToClass() {
      if (this.selectedInstructors.length === 0) {
        return;
      }
      
      // 获取选中的教员
      const instructorsToAdd = this.instructors.filter(instructor => 
        this.selectedInstructors.includes(instructor.id)
      );
      
      // 将教员添加到班级
      this.detailClass.instructors = [
        ...this.detailClass.instructors,
        ...instructorsToAdd
      ];
      
      // 更新原班级数据
      const classIndex = this.classes.findIndex(c => c.id === this.detailClass.id);
      if (classIndex !== -1) {
        this.classes[classIndex].instructors = [...this.detailClass.instructors];
      }
      
      alert(`已成功添加 ${instructorsToAdd.length} 名教员到班级！`);
      this.closeAddInstructorModal();
    },
    
    // ========== 添加学员 ==========
    // 打开添加学员弹窗
    openAddStudentModal() {
      this.studentSearchKeyword = '';
      this.selectedStudents = [];
      this.showAddStudentModal = true;
    },
    
    // 关闭添加学员弹窗
    closeAddStudentModal() {
      this.showAddStudentModal = false;
      this.studentSearchKeyword = '';
      this.selectedStudents = [];
    },
    
    // 搜索可用学员
    searchAvailableStudents() {
      // 通过计算属性自动过滤
    },
    
    // 切换学员选择
    toggleStudentSelection(studentId) {
      const index = this.selectedStudents.indexOf(studentId);
      if (index === -1) {
        this.selectedStudents.push(studentId);
      } else {
        this.selectedStudents.splice(index, 1);
      }
    },
    
    // 添加学员到班级
    addStudentsToClass() {
      if (this.selectedStudents.length === 0) {
        return;
      }
      
      // 获取选中的学员
      const studentsToAdd = this.students.filter(student => 
        this.selectedStudents.includes(student.id)
      );
      
      // 将学员添加到班级
      this.detailClass.students = [
        ...this.detailClass.students,
        ...studentsToAdd
      ];
      
      // 更新原班级数据
      const classIndex = this.classes.findIndex(c => c.id === this.detailClass.id);
      if (classIndex !== -1) {
        this.classes[classIndex].students = [...this.detailClass.students];
      }
      
      alert(`已成功添加 ${studentsToAdd.length} 名学员到班级！`);
      this.closeAddStudentModal();
    },
    
    // ========== 移除教员/学员 ==========
    // 确认移除教员
    confirmRemoveInstructor(instructor) {
      this.pendingRemoveMember = instructor;
      this.isRemovingInstructor = true;
      this.showRemoveConfirm = true;
    },
    
    // 确认移除学员
    confirmRemoveStudent(student) {
      this.pendingRemoveMember = student;
      this.isRemovingInstructor = false;
      this.showRemoveConfirm = true;
    },
    
    // 取消移除成员
    cancelRemoveMember() {
      this.pendingRemoveMember = null;
      this.showRemoveConfirm = false;
    },
    
    // 移除成员
    removeMember() {
      const memberId = this.pendingRemoveMember.id;
      
      if (this.isRemovingInstructor) {
        // 移除教员
        this.detailClass.instructors = this.detailClass.instructors.filter(i => i.id !== memberId);
        
        // 更新原班级数据
        const classIndex = this.classes.findIndex(c => c.id === this.detailClass.id);
        if (classIndex !== -1) {
          this.classes[classIndex].instructors = [...this.detailClass.instructors];
        }
        
        alert(`已成功从班级中移除教员 ${this.pendingRemoveMember.fullName}！`);
      } else {
        // 移除学员
        this.detailClass.students = this.detailClass.students.filter(s => s.id !== memberId);
        
        // 更新原班级数据
        const classIndex = this.classes.findIndex(c => c.id === this.detailClass.id);
        if (classIndex !== -1) {
          this.classes[classIndex].students = [...this.detailClass.students];
        }
        
        alert(`已成功从班级中移除学员 ${this.pendingRemoveMember.fullName}！`);
      }
      
      this.cancelRemoveMember();
    }
  }
}
</script> 

<style scoped>
.class-management-container {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #0C2D48;
  margin-bottom: 20px;
  font-weight: 500;
}

/* 搜索和操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-area {
  display: flex;
  align-items: center;
  flex: 1;
}

.search-input {
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 10px;
  width: 200px;
  margin-right: 10px;
}

.filter-select {
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 10px;
  width: 120px;
  margin-right: 10px;
}

.search-btn, .reset-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
  margin-right: 10px;
  border: none;
}

.search-btn {
  background-color: #1890ff;
  color: white;
}

.reset-btn {
  background-color: white;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.create-btn {
  height: 32px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
}

/* 班级列表 */
.class-list {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow-x: auto;
}

.class-table {
  width: 100%;
  border-collapse: collapse;
}

.class-table th, .class-table td {
  padding: 12px 8px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.class-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
}

.empty-data {
  text-align: center;
  color: #8c8c8c;
  padding: 32px 0;
}

/* 教员标签 */
.instructor-tag {
  display: inline-block;
  margin-right: 4px;
}

.empty-text {
  color: #8c8c8c;
}

/* 操作按钮 */
.actions-cell {
  white-space: nowrap;
}

.view-btn, .edit-btn, .delete-btn {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
  border: none;
}

.view-btn {
  background-color: #e6f7ff;
  color: #1890ff;
}

.edit-btn {
  background-color: #fff7e6;
  color: #fa8c16;
}

.delete-btn {
  background-color: #fff1f0;
  color: #f5222d;
}

/* 分页控件 */
.pagination-area {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.pagination-btn {
  height: 32px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
}

.pagination-btn:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.pagination-info {
  margin: 0 15px;
  color: #595959;
}

/* 模态框 */
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
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
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
  padding: 16px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

/* 详情页样式 */
.detail-modal {
  width: 700px;
}

.detail-section {
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #262626;
}

.detail-value.description {
  white-space: pre-line;
  line-height: 1.5;
}

/* 成员管理 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin: 0;
}

.add-btn {
  padding: 4px 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 14px;
  color: #262626;
}

.member-username {
  font-size: 12px;
  color: #8c8c8c;
}

.remove-btn {
  padding: 2px 8px;
  background-color: #fff1f0;
  color: #f5222d;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.empty-members {
  color: #8c8c8c;
  font-size: 14px;
  padding: 12px 0;
  text-align: center;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.error-text {
  color: #f5222d;
  font-size: 12px;
  margin-top: 4px;
}

/* 按钮样式 */
.cancel-btn, .save-btn, .close-btn, .delete-confirm-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
  border: none;
  margin-left: 10px;
}

.cancel-btn, .close-btn {
  background-color: white;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.save-btn {
  background-color: #1890ff;
  color: white;
}

.delete-confirm-btn {
  background-color: #f5222d;
  color: white;
}

/* 搜索用户弹窗样式 */
.search-container {
  margin-bottom: 16px;
}

.search-box {
  position: relative;
  margin-bottom: 12px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8c8c8c;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.user-item.selected {
  background-color: #e6f7ff;
}

.user-checkbox {
  margin-right: 8px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  color: #262626;
}

.user-username {
  font-size: 12px;
  color: #8c8c8c;
}

.empty-users {
  padding: 16px;
  text-align: center;
  color: #8c8c8c;
}

/* 删除确认弹窗样式 */
.confirm-text {
  font-size: 14px;
  margin-bottom: 16px;
}

.warning-text {
  font-size: 13px;
  color: #fa8c16;
  background-color: #fff7e6;
  padding: 8px 12px;
  border-radius: 4px;
}

.highlight {
  color: #f5222d;
  font-weight: 500;
}
</style> 