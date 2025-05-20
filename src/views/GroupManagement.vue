<template>
  <div class="group-management-container">
    <h1 class="page-title">编组管理</h1>

    <!-- 班级选择区域 -->
    <div class="selection-area">
      <div class="class-selector">
        <label>选择班级：</label>
        <select v-model="selectedClassId" @change="loadClassStudents">
          <option value="">请选择班级</option>
          <option v-for="classItem in classList" :key="classItem.id" :value="classItem.id">
            {{ classItem.name }} ({{ classItem.code }})
          </option>
        </select>
      </div>
    </div>

    <!-- 学生和分组管理区域 -->
    <div class="management-area" v-if="selectedClassId">
      <div class="students-section">
        <div class="section-header">
          <h3>未分组学员 ({{ availableStudents.length }}人)</h3>
          <div class="student-actions">
            <button class="select-all-btn" @click="selectAllStudents" v-if="availableStudents.length > 0">全选</button>
            <button class="auto-group-btn" @click="showAutoGroupModal = true" v-if="availableStudents.length > 0">自动分组</button>
            <button class="manual-group-btn" @click="startManualGrouping" :disabled="selectedStudents.length === 0">手动分组</button>
          </div>
        </div>

        <div class="student-list">
          <div v-for="student in availableStudents" :key="student.id" class="student-item">
            <div class="student-card" :class="{'excluded': student.excluded, 'selected': selectedStudents.includes(student.id)}" @click="toggleStudentSelection(student.id)">
              <div class="student-checkbox">
                <input type="checkbox" :checked="selectedStudents.includes(student.id)" @click.stop>
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.fullName }}</div>
                <div class="student-details">{{ student.username }}</div>
              </div>
              <div class="student-actions">
                <button class="exclude-btn" @click.stop="toggleStudentExclusion(student.id)">
                  {{ student.excluded ? '恢复参与' : '设置不参与' }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="availableStudents.length === 0" class="empty-message">
            当前班级没有未分组的学员或所有学员已被分组
          </div>
        </div>
      </div>

      <!-- 分组区域 -->
      <div class="groups-section">
        <div class="section-header">
          <h3>分组情况 ({{ groups.length }}个小组)</h3>
          <button v-if="groups.length > 0" class="reset-groups-btn" @click="confirmResetGroups">重置所有分组</button>
        </div>
        <div class="groups-container">
          <div v-for="(group, index) in groups" :key="index" class="group-card">
            <div class="group-header">
              <h4>{{ group.name || `小组 ${index + 1}` }}</h4>
              <div class="group-actions">
                <button class="edit-group-btn" @click="editGroup(index)">编辑</button>
                <button class="delete-group-btn" @click="confirmDeleteGroup(index)">删除</button>
              </div>
            </div>
            <div class="group-info" v-if="group.remark">
              <p class="group-remark">{{ group.remark }}</p>
            </div>
            <div class="group-members">
              <div v-for="member in group.members" :key="member.id" class="group-member">
                <div class="member-info">
                  <span class="leader-badge" v-if="member.isLeader">组长</span>
                  <span class="member-name">{{ member.fullName }}</span>
                  <span class="member-role" v-if="member.role">({{ member.role }})</span>
                </div>
                <div class="member-actions">
                  <button class="leader-btn" @click="toggleLeader(index, member.id)">
                    {{ member.isLeader ? '取消组长' : '设为组长' }}
                  </button>
                  <button class="role-btn" @click="editMemberRole(index, member.id)">角色</button>
                  <button class="move-btn" @click="showMoveModal(index, member.id)">移动</button>
                  <button class="remove-btn" @click="removeMember(index, member.id)">移除</button>
                </div>
              </div>
              <div class="add-member" @click="showAddMemberModal(index)">
                <span class="add-icon">+</span> 添加组员
              </div>
              <div v-if="group.members.length === 0" class="empty-group">
                暂无组员，请添加组员
              </div>
            </div>
          </div>
          <div v-if="groups.length === 0" class="empty-groups-message">
            尚未创建任何小组，请通过自动分组或手动分组创建小组
          </div>
        </div>
      </div>
    </div>

    <!-- 自动分组弹窗 -->
    <div class="modal-backdrop" v-if="showAutoGroupModal" @click="showAutoGroupModal = false"></div>
    <div class="modal auto-group-modal" v-if="showAutoGroupModal">
      <div class="modal-header">
        <h3>自动分组</h3>
        <button class="modal-close" @click="showAutoGroupModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>分组方式</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="autoGroupMode" value="groupCount">
                按小组数量
              </label>
              <label class="radio-label">
                <input type="radio" v-model="autoGroupMode" value="memberCount">
                按每组人数
              </label>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" v-if="autoGroupMode === 'groupCount'">
            <label>小组数量</label>
            <input type="number" v-model.number="groupCount" min="1" max="10">
          </div>
          <div class="form-group" v-if="autoGroupMode === 'memberCount'">
            <label>每组人数</label>
            <input type="number" v-model.number="memberCount" min="1" max="20">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="excludeNonParticipants">
              排除已设置不参与的学员
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showAutoGroupModal = false">取消</button>
        <button class="confirm-btn" @click="executeAutoGroup">开始自动分组</button>
      </div>
    </div>

    <!-- 移动组员弹窗 -->
    <div class="modal-backdrop" v-if="showMoveStudentModal" @click="showMoveStudentModal = false"></div>
    <div class="modal move-student-modal" v-if="showMoveStudentModal">
      <div class="modal-header">
        <h3>移动组员</h3>
        <button class="modal-close" @click="showMoveStudentModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>选择目标小组</label>
          <select v-model="targetGroupIndex">
            <option v-for="(group, index) in groups" :key="index" :value="index" 
                    :disabled="index === currentGroupIndex">
              {{ group.name || `小组 ${index + 1}` }}
            </option>
            <option value="-1">移出所有小组</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showMoveStudentModal = false">取消</button>
        <button class="confirm-btn" @click="moveStudent">确认移动</button>
      </div>
    </div>

    <!-- 编辑小组弹窗 -->
    <div class="modal-backdrop" v-if="showEditGroupModal" @click="showEditGroupModal = false"></div>
    <div class="modal edit-group-modal" v-if="showEditGroupModal">
      <div class="modal-header">
        <h3>编辑小组</h3>
        <button class="modal-close" @click="showEditGroupModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>小组名称</label>
          <input type="text" v-model="editingGroup.name" placeholder="请输入小组名称">
        </div>
        <div class="form-group">
          <label>小组备注</label>
          <textarea v-model="editingGroup.remark" placeholder="请输入小组备注" rows="3"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showEditGroupModal = false">取消</button>
        <button class="confirm-btn" @click="saveGroupEdit">保存</button>
      </div>
    </div>

    <!-- 编辑组员角色弹窗 -->
    <div class="modal-backdrop" v-if="showEditRoleModal" @click="showEditRoleModal = false"></div>
    <div class="modal edit-role-modal" v-if="showEditRoleModal">
      <div class="modal-header">
        <h3>编辑组员角色</h3>
        <button class="modal-close" @click="showEditRoleModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>组员姓名</label>
          <input type="text" :value="editingMember.fullName" readonly>
        </div>
        <div class="form-group">
          <label>角色名称</label>
          <input type="text" v-model="editingMember.role" placeholder="请输入角色名称，如：操作手、通讯员等">
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showEditRoleModal = false">取消</button>
        <button class="confirm-btn" @click="saveMemberRole">保存</button>
      </div>
    </div>

    <!-- 添加组员弹窗 -->
    <div class="modal-backdrop" v-if="showAddMemberModal" @click="showAddMemberModal = false"></div>
    <div class="modal add-member-modal" v-if="showAddMemberModal">
      <div class="modal-header">
        <h3>添加组员</h3>
        <button class="modal-close" @click="showAddMemberModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>可选学员</label>
          <div class="student-select-list">
            <div v-for="student in availableStudents" :key="student.id" 
                 class="student-select-item" 
                 :class="{'selected': selectedStudentsToAdd.includes(student.id)}"
                 @click="toggleStudentToAdd(student.id)">
              <div class="student-info">
                <div class="student-name">{{ student.fullName }}</div>
                <div class="student-details">{{ student.username }}</div>
              </div>
              <div class="checkbox">
                <input type="checkbox" :checked="selectedStudentsToAdd.includes(student.id)" @click.stop>
              </div>
            </div>
            <div v-if="availableStudents.length === 0" class="empty-message">
              没有可添加的学员
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showAddMemberModal = false">取消</button>
        <button class="confirm-btn" @click="addMembersToGroup" :disabled="selectedStudentsToAdd.length === 0">
          添加选中学员 ({{ selectedStudentsToAdd.length }}人)
        </button>
      </div>
    </div>

    <!-- 删除小组确认弹窗 -->
    <div class="modal-backdrop" v-if="showDeleteGroupConfirm" @click="cancelDeleteGroup"></div>
    <div class="modal delete-confirm-modal" v-if="showDeleteGroupConfirm">
      <div class="modal-header">
        <h3>确认删除小组</h3>
        <button class="modal-close" @click="cancelDeleteGroup">&times;</button>
      </div>
      <div class="modal-body">
        <p class="confirm-text">
          确定要删除【{{ groups[pendingDeleteGroupIndex]?.name || `小组 ${pendingDeleteGroupIndex + 1}` }}】吗？
          <br>
          <span class="warning-text">删除后，该小组的所有组员将被移出小组并变为未分组状态。此操作不可撤销。</span>
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDeleteGroup">取消</button>
        <button class="delete-btn" @click="deleteGroup">确认删除</button>
      </div>
    </div>

    <!-- 重置所有分组确认弹窗 -->
    <div class="modal-backdrop" v-if="showResetGroupsConfirm" @click="cancelResetGroups"></div>
    <div class="modal reset-confirm-modal" v-if="showResetGroupsConfirm">
      <div class="modal-header">
        <h3>确认重置所有分组</h3>
        <button class="modal-close" @click="cancelResetGroups">&times;</button>
      </div>
      <div class="modal-body">
        <p class="confirm-text">
          确定要重置所有分组吗？
          <br>
          <span class="warning-text">重置后，将删除所有小组，所有学员将变为未分组状态。此操作不可撤销。</span>
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelResetGroups">取消</button>
        <button class="delete-btn" @click="resetAllGroups">确认重置</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GroupManagement',
  data() {
    return {
      // 基础数据
      selectedClassId: '',
      classList: [],
      students: [],
      groups: [],
      
      // 学生选择
      selectedStudents: [],
      
      // 分组弹窗
      showAutoGroupModal: false,
      autoGroupMode: 'groupCount',
      groupCount: 4,
      memberCount: 5,
      excludeNonParticipants: true,
      
      // 移动组员
      showMoveStudentModal: false,
      currentGroupIndex: -1,
      currentStudentId: null,
      targetGroupIndex: -1,
      
      // 编辑小组
      showEditGroupModal: false,
      editingGroupIndex: -1,
      editingGroup: {
        name: '',
        remark: ''
      },

      // 编辑组员角色
      showEditRoleModal: false,
      editingMember: {
        id: null,
        fullName: '',
        role: ''
      },

      // 添加组员
      showAddMemberModal: false,
      selectedStudentsToAdd: [],

      // 删除小组
      showDeleteGroupConfirm: false,
      pendingDeleteGroupIndex: -1,

      // 重置所有分组
      showResetGroupsConfirm: false
    }
  },
  computed: {
    // 获取未分配到小组的学生列表
    availableStudents() {
      if (!this.students.length) return [];
      
      // 获取所有已分配到小组的学生ID
      const assignedStudentIds = this.groups.reduce((ids, group) => {
        group.members.forEach(member => {
          ids.push(member.id);
        });
        return ids;
      }, []);
      
      // 过滤出未分配的学生
      return this.students.filter(student => !assignedStudentIds.includes(student.id));
    }
  },
  created() {
    // 获取班级列表
    this.fetchClassList();
  },
  methods: {
    // 获取班级列表
    fetchClassList() {
      // 模拟从 API 获取班级列表
      this.classList = [
        { id: 1, name: '新兵连一班', code: 'XBL-01' },
        { id: 2, name: '新兵连二班', code: 'XBL-02' },
        { id: 3, name: '特种作战训练班', code: 'TSC-01' }
      ];
    },
    
    // 加载班级学员
    loadClassStudents() {
      if (!this.selectedClassId) {
        this.students = [];
        this.groups = [];
        return;
      }
      
      // 模拟从 API 获取学员列表，确保与班级管理和用户管理中的学员一致
      const studentsData = {
        1: [ // 新兵连一班
          { id: 3, username: 'student_wang', fullName: '王学员', excluded: false },
          { id: 8, username: 'student_yang', fullName: '杨学员', excluded: false },
          { id: 17, username: 'student_gao', fullName: '高学员', excluded: false },
          { id: 18, username: 'student_lin', fullName: '林学员', excluded: false },
          { id: 19, username: 'student_he', fullName: '何学员', excluded: false },
          { id: 20, username: 'student_ma', fullName: '马学员', excluded: false },
          { id: 21, username: 'student_luo', fullName: '罗学员', excluded: false },
          { id: 22, username: 'student_peng', fullName: '彭学员', excluded: false },
          { id: 23, username: 'student_chen', fullName: '陈学员', excluded: false },
          { id: 24, username: 'student_xie', fullName: '谢学员', excluded: false }
        ],
        2: [ // 新兵连二班
          { id: 7, username: 'student_liu', fullName: '刘学员', excluded: false },
          { id: 25, username: 'student_hu', fullName: '胡学员', excluded: false },
          { id: 26, username: 'student_tian', fullName: '田学员', excluded: false },
          { id: 27, username: 'student_xu', fullName: '徐学员', excluded: false },
          { id: 28, username: 'student_deng', fullName: '邓学员', excluded: false },
          { id: 29, username: 'student_cao', fullName: '曹学员', excluded: false },
          { id: 30, username: 'student_feng', fullName: '冯学员', excluded: false },
          { id: 31, username: 'student_tang', fullName: '唐学员', excluded: false },
          { id: 32, username: 'student_pan', fullName: '潘学员', excluded: false },
          { id: 33, username: 'student_liang', fullName: '梁学员', excluded: false }
        ],
        3: [ // 特种作战训练班
          { id: 9, username: 'student_zhang', fullName: '张学员', excluded: false },
          { id: 10, username: 'student_zhao', fullName: '赵学员', excluded: false },
          { id: 11, username: 'student_qian', fullName: '钱学员', excluded: false },
          { id: 12, username: 'student_sun', fullName: '孙学员', excluded: false },
          { id: 13, username: 'student_li', fullName: '李学员', excluded: false },
          { id: 14, username: 'student_zhou', fullName: '周学员', excluded: false },
          { id: 15, username: 'student_wu', fullName: '吴学员', excluded: false },
          { id: 16, username: 'student_zheng', fullName: '郑学员', excluded: false }
        ]
      };
      
      this.students = studentsData[this.selectedClassId] || [];
      this.selectedStudents = [];
      this.groups = [];
    },
    
    // 切换学生选择
    toggleStudentSelection(studentId) {
      const index = this.selectedStudents.indexOf(studentId);
      if (index === -1) {
        this.selectedStudents.push(studentId);
      } else {
        this.selectedStudents.splice(index, 1);
      }
    },
    
    // 切换学生排除状态
    toggleStudentExclusion(studentId) {
      const student = this.students.find(s => s.id === studentId);
      if (student) {
        student.excluded = !student.excluded;
        
        // 如果将学生设为不参与，且学生已被选中，则取消选中
        if (student.excluded) {
          const index = this.selectedStudents.indexOf(studentId);
          if (index !== -1) {
            this.selectedStudents.splice(index, 1);
          }
        }
      }
    },
    
    // 开始手动分组
    startManualGrouping() {
      if (this.selectedStudents.length === 0) {
        alert('请先选择至少一名学生');
        return;
      }
      
      // 创建一个新组
      const newGroup = {
        name: '',
        remark: '',
        members: []
      };
      
      // 将选中的学生添加到新组
      this.selectedStudents.forEach(studentId => {
        const student = this.students.find(s => s.id === studentId);
        if (student && !student.excluded) {
          newGroup.members.push({
            id: student.id,
            username: student.username,
            fullName: student.fullName,
            role: '',
            isLeader: false
          });
        }
      });
      
      this.groups.push(newGroup);
      this.selectedStudents = [];
    },
    
    // 执行自动分组
    executeAutoGroup() {
      const eligibleStudents = this.availableStudents.filter(student => 
        !this.excludeNonParticipants || !student.excluded
      );
      
      if (eligibleStudents.length === 0) {
        alert('没有可用于分组的学员');
        return;
      }
      
      // 如果仅选中的学生进行分组
      let studentsToGroup = eligibleStudents;
      if (this.selectedStudents.length > 0) {
        studentsToGroup = eligibleStudents.filter(s => 
          this.selectedStudents.includes(s.id)
        );
        
        if (studentsToGroup.length === 0) {
          alert('选中的学员中没有可分组的学员');
          return;
        }
      }
      
      // 随机打乱学生顺序
      studentsToGroup = this.shuffleArray([...studentsToGroup]);
      
      // 计算分组数量和每组人数
      let calculatedGroupCount, calculatedMemberCount;
      if (this.autoGroupMode === 'groupCount') {
        calculatedGroupCount = Math.min(this.groupCount, studentsToGroup.length);
        calculatedMemberCount = Math.ceil(studentsToGroup.length / calculatedGroupCount);
      } else {
        calculatedMemberCount = Math.min(this.memberCount, studentsToGroup.length);
        calculatedGroupCount = Math.ceil(studentsToGroup.length / calculatedMemberCount);
      }
      
      // 创建分组
      const newGroups = [];
      for (let i = 0; i < calculatedGroupCount; i++) {
        newGroups.push({
          name: `小组 ${i + 1}`,
          remark: '',
          members: []
        });
      }
      
      // 分配学生到各个小组
      studentsToGroup.forEach((student, index) => {
        const groupIndex = index % calculatedGroupCount;
        newGroups[groupIndex].members.push({
          id: student.id,
          username: student.username,
          fullName: student.fullName,
          role: '',
          isLeader: false
        });
      });
      
      // 更新分组
      this.groups = [...this.groups, ...newGroups];
      this.selectedStudents = [];
      this.showAutoGroupModal = false;
    },
    
    // 打乱数组顺序
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
    
    // 编辑小组
    editGroup(index) {
      this.editingGroupIndex = index;
      this.editingGroup = { ...this.groups[index] };
      this.showEditGroupModal = true;
    },
    
    // 保存小组编辑
    saveGroupEdit() {
      if (this.editingGroupIndex >= 0 && this.editingGroupIndex < this.groups.length) {
        this.groups[this.editingGroupIndex].name = this.editingGroup.name;
        this.groups[this.editingGroupIndex].remark = this.editingGroup.remark;
      }
      this.showEditGroupModal = false;
    },
    
    // 切换组长
    toggleLeader(groupIndex, studentId) {
      const group = this.groups[groupIndex];
      if (!group) return;
      
      const member = group.members.find(m => m.id === studentId);
      if (!member) return;
      
      if (member.isLeader) {
        // 取消组长
        member.isLeader = false;
      } else {
        // 先取消当前组长
        group.members.forEach(m => {
          if (m.isLeader) m.isLeader = false;
        });
        
        // 设置新组长
        member.isLeader = true;
      }
    },
    
    // 显示移动组员弹窗
    showMoveModal(groupIndex, studentId) {
      this.currentGroupIndex = groupIndex;
      this.currentStudentId = studentId;
      this.targetGroupIndex = -1; // 默认移出所有小组
      this.showMoveStudentModal = true;
    },
    
    // 移动组员
    moveStudent() {
      if (this.currentGroupIndex < 0 || this.currentGroupIndex >= this.groups.length) {
        this.showMoveStudentModal = false;
        return;
      }
      
      const sourceGroup = this.groups[this.currentGroupIndex];
      const memberIndex = sourceGroup.members.findIndex(m => m.id === this.currentStudentId);
      
      if (memberIndex < 0) {
        this.showMoveStudentModal = false;
        return;
      }
      
      // 从源小组移除
      const member = sourceGroup.members.splice(memberIndex, 1)[0];
      
      // 如果目标小组索引有效，则添加到目标小组
      if (this.targetGroupIndex >= 0 && this.targetGroupIndex < this.groups.length) {
        this.groups[this.targetGroupIndex].members.push(member);
      }
      
      this.showMoveStudentModal = false;
    },
    
    // 从小组中移除成员
    removeMember(groupIndex, studentId) {
      if (groupIndex < 0 || groupIndex >= this.groups.length) return;
      
      const group = this.groups[groupIndex];
      const memberIndex = group.members.findIndex(m => m.id === studentId);
      
      if (memberIndex >= 0) {
        group.members.splice(memberIndex, 1);
      }
    },

    // 编辑组员角色
    editMemberRole(groupIndex, studentId) {
      this.editingGroupIndex = groupIndex;
      const member = this.groups[groupIndex].members.find(m => m.id === studentId);
      if (member) {
        this.editingMember = { ...member };
        this.showEditRoleModal = true;
      }
    },

    // 保存组员角色
    saveMemberRole() {
      if (!this.editingMember) return;
      
      const groupIndex = this.editingGroupIndex;
      const memberIndex = this.groups[groupIndex].members.findIndex(m => m.id === this.editingMember.id);
      
      if (memberIndex !== -1) {
        this.groups[groupIndex].members[memberIndex].role = this.editingMember.role;
      }
      
      this.showEditRoleModal = false;
    },

    // 显示添加组员弹窗
    showAddMemberModal(groupIndex) {
      this.currentGroupIndex = groupIndex;
      this.selectedStudentsToAdd = [];
      this.showAddMemberModal = true;
    },

    // 切换学生添加选择
    toggleStudentToAdd(studentId) {
      const index = this.selectedStudentsToAdd.indexOf(studentId);
      if (index === -1) {
        this.selectedStudentsToAdd.push(studentId);
      } else {
        this.selectedStudentsToAdd.splice(index, 1);
      }
    },

    // 添加组员到小组
    addMembersToGroup() {
      if (this.currentGroupIndex < 0 || this.currentGroupIndex >= this.groups.length) return;
      
      const group = this.groups[this.currentGroupIndex];
      
      this.selectedStudentsToAdd.forEach(studentId => {
        const student = this.availableStudents.find(s => s.id === studentId);
        if (student && !student.excluded) {
          group.members.push({
            id: student.id,
            username: student.username,
            fullName: student.fullName,
            role: '',
            isLeader: false
          });
        }
      });
      
      this.selectedStudentsToAdd = [];
      this.showAddMemberModal = false;
    },

    // 选择所有可用学生
    selectAllStudents() {
      const availableIds = this.availableStudents
        .filter(student => !student.excluded)
        .map(student => student.id);
      
      this.selectedStudents = availableIds;
    },

    // 确认删除小组
    confirmDeleteGroup(index) {
      this.pendingDeleteGroupIndex = index;
      this.showDeleteGroupConfirm = true;
    },

    // 取消删除小组
    cancelDeleteGroup() {
      this.pendingDeleteGroupIndex = -1;
      this.showDeleteGroupConfirm = false;
    },

    // 删除小组
    deleteGroup() {
      if (this.pendingDeleteGroupIndex < 0 || this.pendingDeleteGroupIndex >= this.groups.length) {
        this.cancelDeleteGroup();
        return;
      }
      
      // 删除小组，学生自动变为未分组状态
      this.groups.splice(this.pendingDeleteGroupIndex, 1);
      this.cancelDeleteGroup();
    },

    // 确认重置所有分组
    confirmResetGroups() {
      this.showResetGroupsConfirm = true;
    },

    // 取消重置所有分组
    cancelResetGroups() {
      this.showResetGroupsConfirm = false;
    },

    // 重置所有分组
    resetAllGroups() {
      this.groups = [];
      this.showResetGroupsConfirm = false;
    }
  }
}
</script>

<style scoped>
.group-management-container {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #0C2D48;
  margin-bottom: 20px;
  font-weight: 500;
}

.selection-area {
  margin-bottom: 20px;
}

.class-selector {
  display: flex;
  align-items: center;
}

.class-selector label {
  margin-right: 10px;
}

.class-selector select {
  padding: 5px;
}

.management-area {
  display: flex;
}

.students-section {
  flex: 1;
  margin-right: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  font-size: 18px;
  color: #0C2D48;
  font-weight: 500;
}

.section-header button {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.student-list {
  margin-bottom: 20px;
}

.student-item {
  margin-bottom: 10px;
}

.student-card {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}

.student-checkbox {
  margin-right: 10px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 16px;
  color: #0C2D48;
  font-weight: 500;
}

.student-details {
  font-size: 14px;
  color: #666;
}

.student-actions {
  display: flex;
  align-items: center;
}

.exclude-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.empty-message {
  text-align: center;
  color: #666;
  margin-top: 10px;
}

.groups-section {
  flex: 1;
}

.groups-container {
  display: flex;
  flex-wrap: wrap;
}

.group-card {
  width: calc(33.33% - 20px);
  margin: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow: hidden;
}

.group-header {
  background-color: #0C2D48;
  color: #fff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-header h4 {
  font-size: 16px;
  font-weight: 500;
}

.group-header button {
  padding: 5px 10px;
  background-color: #fff;
  color: #0C2D48;
  border: none;
  cursor: pointer;
}

.group-info {
  padding: 10px;
}

.group-remark {
  font-size: 14px;
  color: #666;
}

.group-members {
  padding: 10px;
}

.group-member {
  margin-bottom: 10px;
}

.member-info {
  display: flex;
  align-items: center;
}

.leader-badge {
  background-color: #FFD700;
  color: #000;
  padding: 2px 5px;
  border-radius: 3px;
  margin-right: 5px;
}

.member-name {
  font-size: 16px;
  color: #0C2D48;
  font-weight: 500;
}

.member-role {
  font-size: 14px;
  color: #666;
}

.member-actions {
  display: flex;
  align-items: center;
}

.leader-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.role-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.move-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.remove-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.empty-group {
  text-align: center;
  color: #666;
  margin-top: 10px;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  color: #0C2D48;
  font-weight: 500;
}

.modal-header button {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.modal-body {
  margin-bottom: 20px;
}

.form-row {
  margin-bottom: 10px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 5px;
}

.radio-group {
  display: flex;
  align-items: center;
}

.radio-label {
  margin-right: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
}

.checkbox-label input {
  margin-right: 5px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.confirm-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.student-select-list {
  max-height: 200px;
  overflow-y: auto;
}

.student-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  cursor: pointer;
}

.student-select-item.selected {
  background-color: #0C2D48;
  color: #fff;
}

.checkbox {
  margin-left: 10px;
}

.student-info {
  flex: 1;
}

.add-icon {
  margin-right: 5px;
}

.reset-groups-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.empty-groups-message {
  text-align: center;
  color: #666;
  margin-top: 10px;
}

.group-actions {
  display: flex;
  align-items: center;
}

.edit-group-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.delete-group-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}

.select-all-btn {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: #fff;
  border: none;
  cursor: pointer;
}
</style> 