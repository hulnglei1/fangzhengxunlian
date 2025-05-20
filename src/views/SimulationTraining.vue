<template>
  <div class="simulation-training-container">
    <h1 class="page-title">仿真训练管理</h1>

    <!-- 搜索和操作栏 -->
    <div class="action-bar">
      <div class="search-area">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="请输入训练名称/代号搜索" 
          class="search-input" 
          @keyup.enter="searchTrainings"
        />
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="guided">引导训练</option>
          <option value="combat">作战训练</option>
          <option value="command">指挥训练</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">全部状态</option>
          <option value="planned">计划中</option>
          <option value="ongoing">进行中</option>
          <option value="completed">已完成</option>
        </select>
        <button class="search-btn" @click="searchTrainings">查询</button>
        <button class="reset-btn" @click="resetSearch">重置</button>
      </div>
      <div class="action-btns">
        <button class="create-btn" @click="openCreateModal">创建训练</button>
      </div>
    </div>

    <!-- 训练列表 -->
    <div class="training-list">
      <table class="training-table">
        <thead>
          <tr>
            <th width="5%">序号</th>
            <th width="15%">训练名称</th>
            <th width="10%">训练代号</th>
            <th width="10%">训练类型</th>
            <th width="15%">参训班级</th>
            <th width="15%">开始时间</th>
            <th width="10%">状态</th>
            <th width="20%">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(training, index) in filteredTrainings" :key="training.id">
            <td>{{ index + 1 }}</td>
            <td>{{ training.name }}</td>
            <td>{{ training.code }}</td>
            <td>
              <span class="type-tag" :class="training.type">
                {{ getTypeText(training.type) }}
              </span>
            </td>
            <td>{{ training.className }}</td>
            <td>{{ formatDateTime(training.startTime) }}</td>
            <td>
              <span class="status-tag" :class="training.status">
                {{ getStatusText(training.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="view-btn" @click="viewTrainingDetails(training)">查看详情</button>
              <button class="edit-btn" @click="openEditModal(training)">修改</button>
              <button class="delete-btn" @click="confirmDelete(training)">删除</button>
            </td>
          </tr>
          <tr v-if="filteredTrainings.length === 0">
            <td colspan="8" class="empty-data">暂无训练数据</td>
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

    <!-- 训练详情弹窗 -->
    <div class="modal-backdrop" v-if="showDetailModal" @click="closeDetailModal"></div>
    <div class="modal detail-modal" v-if="showDetailModal">
      <div class="modal-header">
        <h3>训练详情：{{ detailTraining.name }} ({{ detailTraining.code }})</h3>
        <button class="modal-close" @click="closeDetailModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-section">
          <div class="detail-row">
            <div class="detail-label">训练名称</div>
            <div class="detail-value">{{ detailTraining.name }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">训练代号</div>
            <div class="detail-value">{{ detailTraining.code }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">训练类型</div>
            <div class="detail-value">
              <span class="type-tag" :class="detailTraining.type">
                {{ getTypeText(detailTraining.type) }}
              </span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-label">参训班级</div>
            <div class="detail-value">{{ detailTraining.className }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">开始时间</div>
            <div class="detail-value">{{ formatDateTime(detailTraining.startTime, true) }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">结束时间</div>
            <div class="detail-value">{{ formatDateTime(detailTraining.endTime, true) }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">负责教员</div>
            <div class="detail-value">{{ detailTraining.instructor }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">训练状态</div>
            <div class="detail-value">
              <span class="status-tag" :class="detailTraining.status">
                {{ getStatusText(detailTraining.status) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-label">训练描述</div>
          <div class="detail-value description">{{ detailTraining.description }}</div>
        </div>
        
        <div class="detail-section">
          <div class="detail-label">训练目标</div>
          <div class="detail-value">{{ detailTraining.objectives }}</div>
        </div>
        
        <div class="detail-section">
          <div class="detail-label">参训人员</div>
          <div class="detail-value">
            <div class="participants-list" v-if="detailTraining.participants && detailTraining.participants.length > 0">
              <div class="participant-item" v-for="(participant, index) in detailTraining.participants" :key="index">
                {{ participant }}
              </div>
            </div>
            <div v-else class="empty-text">暂无参训人员信息</div>
          </div>
        </div>
        
        <div class="detail-section" v-if="detailTraining.status === 'completed'">
          <div class="detail-label">训练评估</div>
          <div class="detail-value">{{ detailTraining.evaluation || '暂无评估信息' }}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="close-btn" @click="closeDetailModal">关闭</button>
        <button class="edit-btn" @click="editFromDetail">编辑训练</button>
      </div>
    </div>

    <!-- 创建/编辑训练弹窗 -->
    <div class="modal-backdrop" v-if="showEditModal" @click="closeEditModal"></div>
    <div class="modal" v-if="showEditModal">
      <div class="modal-header">
        <h3>{{ isCreating ? '创建训练' : '编辑训练' }}</h3>
        <button class="modal-close" @click="closeEditModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>训练名称</label>
          <input type="text" v-model="trainingForm.name" placeholder="请输入训练名称" />
          <p class="error-text" v-if="formErrors.name">{{ formErrors.name }}</p>
        </div>
        
        <div class="form-group">
          <label>训练代号</label>
          <input type="text" v-model="trainingForm.code" placeholder="请输入训练代号" />
          <p class="error-text" v-if="formErrors.code">{{ formErrors.code }}</p>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>训练类型</label>
            <select v-model="trainingForm.type">
              <option value="guided">引导训练</option>
              <option value="combat">作战训练</option>
              <option value="command">指挥训练</option>
            </select>
            <p class="error-text" v-if="formErrors.type">{{ formErrors.type }}</p>
          </div>
          
          <div class="form-group half">
            <label>参训班级</label>
            <select v-model="trainingForm.className">
              <option value="新兵连一班">新兵连一班</option>
              <option value="特种作战训练班">特种作战训练班</option>
              <option value="通信班二组">通信班二组</option>
              <option value="侦察兵三组">侦察兵三组</option>
            </select>
            <p class="error-text" v-if="formErrors.className">{{ formErrors.className }}</p>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>开始时间</label>
            <input type="datetime-local" v-model="trainingForm.startTimeInput" />
            <p class="error-text" v-if="formErrors.startTime">{{ formErrors.startTime }}</p>
          </div>
          
          <div class="form-group half">
            <label>结束时间</label>
            <input type="datetime-local" v-model="trainingForm.endTimeInput" />
            <p class="error-text" v-if="formErrors.endTime">{{ formErrors.endTime }}</p>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>负责教员</label>
            <input type="text" v-model="trainingForm.instructor" placeholder="请输入教员姓名" />
            <p class="error-text" v-if="formErrors.instructor">{{ formErrors.instructor }}</p>
          </div>
          
          <div class="form-group half">
            <label>训练状态</label>
            <select v-model="trainingForm.status">
              <option value="planned">计划中</option>
              <option value="ongoing">进行中</option>
              <option value="completed">已完成</option>
            </select>
            <p class="error-text" v-if="formErrors.status">{{ formErrors.status }}</p>
          </div>
        </div>
        
        <div class="form-group">
          <label>训练描述</label>
          <textarea 
            v-model="trainingForm.description" 
            placeholder="请输入训练描述"
            rows="3"
          ></textarea>
          <p class="error-text" v-if="formErrors.description">{{ formErrors.description }}</p>
        </div>
        
        <div class="form-group">
          <label>训练目标</label>
          <textarea 
            v-model="trainingForm.objectives" 
            placeholder="请输入训练目标"
            rows="2"
          ></textarea>
          <p class="error-text" v-if="formErrors.objectives">{{ formErrors.objectives }}</p>
        </div>
        
        <div class="form-group">
          <label>参训人员</label>
          <div class="participants-inputs">
            <div 
              v-for="(participant, index) in trainingForm.participants" 
              :key="index" 
              class="participant-input-row"
            >
              <input 
                type="text" 
                v-model="trainingForm.participants[index]" 
                placeholder="请输入参训人员姓名"
              />
              <button class="remove-participant-btn" @click="removeParticipant(index)">&times;</button>
            </div>
            <button class="add-participant-btn" @click="addParticipant">添加参训人员</button>
          </div>
        </div>
        
        <div class="form-group" v-if="trainingForm.status === 'completed'">
          <label>训练评估</label>
          <textarea 
            v-model="trainingForm.evaluation" 
            placeholder="请输入训练评估"
            rows="3"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeEditModal">取消</button>
        <button class="save-btn" @click="saveTraining">保存</button>
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
          确定要删除训练 <span class="highlight">{{ pendingDeleteTraining?.name }}</span> 吗？
          此操作无法撤销。
        </p>
        <p class="warning-text">
          删除训练将导致该训练的所有记录和评估数据一并删除。
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDelete">取消</button>
        <button class="delete-confirm-btn" @click="deleteTraining">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimulationTraining',
  data() {
    return {
      // 搜索和筛选
      searchKeyword: '',
      filterType: '',
      filterStatus: '',
      
      // 分页
      currentPage: 1,
      pageSize: 10,
      
      // 模态框控制
      showDetailModal: false,
      showEditModal: false,
      showDeleteConfirm: false,
      isCreating: false,
      
      // 表单数据
      trainingForm: {
        id: null,
        name: '',
        code: '',
        type: 'guided',
        className: '',
        startTimeInput: '',
        endTimeInput: '',
        instructor: '',
        status: 'planned',
        description: '',
        objectives: '',
        participants: [],
        evaluation: ''
      },
      
      // 表单错误
      formErrors: {
        name: '',
        code: '',
        type: '',
        className: '',
        startTime: '',
        endTime: '',
        instructor: '',
        status: '',
        description: '',
        objectives: ''
      },
      
      // 查看详情的训练
      detailTraining: {},
      
      // 待删除的训练
      pendingDeleteTraining: null,
      
      // 临时数据 - 实际项目中应从API获取
      trainings: [
        {
          id: 1,
          name: '战术指挥模拟训练1',
          code: 'CMD-2023-001',
          type: 'command',
          className: '特种作战训练班',
          startTime: new Date('2023-05-15T09:00:00'),
          endTime: new Date('2023-05-15T17:00:00'),
          instructor: '李教官',
          status: 'planned',
          description: '本训练旨在通过模拟实战环境，提高指挥人员的战术决策能力和协同作战能力。',
          objectives: '提高战术决策能力、加强协同配合、熟悉作战流程',
          participants: ['王学员', '张学员', '李学员', '刘学员'],
          evaluation: ''
        },
        {
          id: 2,
          name: '通信设备操作训练',
          code: 'COM-2023-005',
          type: 'guided',
          className: '新兵连一班',
          startTime: new Date('2023-05-10T08:30:00'),
          endTime: new Date('2023-05-10T16:30:00'),
          instructor: '张教官',
          status: 'completed',
          description: '通过实际操作各类通信设备，提高学员的通信保障能力和故障排除能力。',
          objectives: '掌握通信设备操作、熟悉通信保障流程、提高故障排除能力',
          participants: ['杨学员', '赵学员', '钱学员'],
          evaluation: '整体表现良好，基本掌握了通信设备的操作方法，但在复杂环境下的故障排除还需加强训练。'
        },
        {
          id: 3,
          name: '合成营作战训练',
          code: 'CBT-2023-008',
          type: 'combat',
          className: '特种作战训练班',
          startTime: new Date('2023-05-20T07:00:00'),
          endTime: new Date('2023-05-22T18:00:00'),
          instructor: '王教官',
          status: 'planned',
          description: '通过模拟合成营作战环境，训练各兵种协同作战能力，提高整体作战效能。',
          objectives: '提高协同作战能力、熟悉合成营战术、加强各兵种配合',
          participants: ['李学员', '张学员', '王学员', '刘学员', '赵学员'],
          evaluation: ''
        },
        {
          id: 4,
          name: '电子对抗实战演练',
          code: 'EW-2023-003',
          type: 'combat',
          className: '通信班二组',
          startTime: new Date('2023-05-12T09:00:00'),
          endTime: new Date('2023-05-13T17:00:00'),
          instructor: '孙教官',
          status: 'ongoing',
          description: '在复杂电磁环境下，进行电子对抗演练，提高部队在信息化战场上的生存能力。',
          objectives: '熟悉电子对抗手段、提高抗干扰能力、加强通信保密',
          participants: ['钱学员', '孙学员', '李学员'],
          evaluation: ''
        },
        {
          id: 5,
          name: '侦察兵技能训练',
          code: 'REC-2023-002',
          type: 'guided',
          className: '侦察兵三组',
          startTime: new Date('2023-05-08T08:00:00'),
          endTime: new Date('2023-05-09T17:00:00'),
          instructor: '赵教官',
          status: 'completed',
          description: '针对侦察兵特殊技能进行强化训练，包括野外生存、信息收集、隐蔽行动等。',
          objectives: '提高野外生存能力、加强信息收集技巧、熟练掌握隐蔽技能',
          participants: ['周学员', '吴学员', '郑学员'],
          evaluation: '训练效果显著，学员们在野外生存和隐蔽行动方面表现优秀，但信息收集的准确性有待提高。'
        }
      ]
    }
  },
  computed: {
    filteredTrainings() {
      let result = [...this.trainings]
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(training => 
          training.name.toLowerCase().includes(keyword) || 
          training.code.toLowerCase().includes(keyword)
        )
      }
      
      // 类型筛选
      if (this.filterType) {
        result = result.filter(training => training.type === this.filterType)
      }
      
      // 状态筛选
      if (this.filterStatus) {
        result = result.filter(training => training.status === this.filterStatus)
      }
      
      // 分页
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      
      return result.slice(start, end)
    },
    totalTrainings() {
      let result = [...this.trainings]
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(training => 
          training.name.toLowerCase().includes(keyword) || 
          training.code.toLowerCase().includes(keyword)
        )
      }
      
      // 类型筛选
      if (this.filterType) {
        result = result.filter(training => training.type === this.filterType)
      }
      
      // 状态筛选
      if (this.filterStatus) {
        result = result.filter(training => training.status === this.filterStatus)
      }
      
      return result.length
    },
    totalPages() {
      return Math.ceil(this.totalTrainings / this.pageSize)
    }
  },
  methods: {
    // 搜索训练
    searchTrainings() {
      this.currentPage = 1
    },
    
    // 重置搜索
    resetSearch() {
      this.searchKeyword = ''
      this.filterType = ''
      this.filterStatus = ''
      this.currentPage = 1
    },
    
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    
    // 格式化日期时间
    formatDateTime(date, showTime = false) {
      if (!date) return ''
      date = new Date(date)
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      if (showTime) {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      }
      
      return `${year}-${month}-${day}`
    },
    
    // 获取类型文本
    getTypeText(type) {
      const typeMap = {
        guided: '引导训练',
        combat: '作战训练',
        command: '指挥训练'
      }
      return typeMap[type] || '未知'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        planned: '计划中',
        ongoing: '进行中',
        completed: '已完成'
      }
      return statusMap[status] || '未知'
    },
    
    // 查看训练详情
    viewTrainingDetails(training) {
      this.detailTraining = JSON.parse(JSON.stringify(training))
      this.showDetailModal = true
    },
    
    // 关闭详情弹窗
    closeDetailModal() {
      this.showDetailModal = false
      this.detailTraining = {}
    },
    
    // 从详情编辑
    editFromDetail() {
      this.closeDetailModal()
      this.openEditModal(this.detailTraining)
    },
    
    // 打开编辑弹窗
    openEditModal(training) {
      this.isCreating = false
      
      // 深拷贝训练数据
      const trainingCopy = JSON.parse(JSON.stringify(training))
      
      // 格式化日期时间为input所需格式
      const startDate = new Date(trainingCopy.startTime)
      const endDate = new Date(trainingCopy.endTime)
      
      const formatDateTime = (date) => {
        return date.getFullYear() +
          '-' + String(date.getMonth() + 1).padStart(2, '0') +
          '-' + String(date.getDate()).padStart(2, '0') +
          'T' + String(date.getHours()).padStart(2, '0') +
          ':' + String(date.getMinutes()).padStart(2, '0')
      }
      
      this.trainingForm = {
        ...trainingCopy,
        startTimeInput: formatDateTime(startDate),
        endTimeInput: formatDateTime(endDate)
      }
      
      this.clearFormErrors()
      this.showEditModal = true
    },
    
    // 打开创建弹窗
    openCreateModal() {
      this.isCreating = true
      
      // 重置表单
      this.trainingForm = {
        id: null,
        name: '',
        code: '',
        type: 'guided',
        className: '',
        startTimeInput: '',
        endTimeInput: '',
        instructor: '',
        status: 'planned',
        description: '',
        objectives: '',
        participants: [],
        evaluation: ''
      }
      
      this.clearFormErrors()
      this.showEditModal = true
    },
    
    // 关闭编辑弹窗
    closeEditModal() {
      this.showEditModal = false
      this.clearFormErrors()
    },
    
    // 清除表单错误
    clearFormErrors() {
      this.formErrors = {
        name: '',
        code: '',
        type: '',
        className: '',
        startTime: '',
        endTime: '',
        instructor: '',
        status: '',
        description: '',
        objectives: ''
      }
    },
    
    // 添加参训人员
    addParticipant() {
      if (!this.trainingForm.participants) {
        this.trainingForm.participants = []
      }
      this.trainingForm.participants.push('')
    },
    
    // 移除参训人员
    removeParticipant(index) {
      this.trainingForm.participants.splice(index, 1)
    },
    
    // 验证表单
    validateForm() {
      let isValid = true
      this.clearFormErrors()
      
      // 验证训练名称
      if (!this.trainingForm.name.trim()) {
        this.formErrors.name = '请输入训练名称'
        isValid = false
      }
      
      // 验证训练代号
      if (!this.trainingForm.code.trim()) {
        this.formErrors.code = '请输入训练代号'
        isValid = false
      }
      
      // 验证训练类型
      if (!this.trainingForm.type) {
        this.formErrors.type = '请选择训练类型'
        isValid = false
      }
      
      // 验证参训班级
      if (!this.trainingForm.className) {
        this.formErrors.className = '请选择参训班级'
        isValid = false
      }
      
      // 验证开始时间
      if (!this.trainingForm.startTimeInput) {
        this.formErrors.startTime = '请选择开始时间'
        isValid = false
      }
      
      // 验证结束时间
      if (!this.trainingForm.endTimeInput) {
        this.formErrors.endTime = '请选择结束时间'
        isValid = false
      } else if (this.trainingForm.startTimeInput && this.trainingForm.endTimeInput) {
        const startTime = new Date(this.trainingForm.startTimeInput)
        const endTime = new Date(this.trainingForm.endTimeInput)
        
        if (endTime <= startTime) {
          this.formErrors.endTime = '结束时间必须晚于开始时间'
          isValid = false
        }
      }
      
      // 验证负责教员
      if (!this.trainingForm.instructor) {
        this.formErrors.instructor = '请输入负责教员'
        isValid = false
      }
      
      // 验证训练状态
      if (!this.trainingForm.status) {
        this.formErrors.status = '请选择训练状态'
        isValid = false
      }
      
      // 验证训练描述
      if (!this.trainingForm.description.trim()) {
        this.formErrors.description = '请输入训练描述'
        isValid = false
      }
      
      // 验证训练目标
      if (!this.trainingForm.objectives.trim()) {
        this.formErrors.objectives = '请输入训练目标'
        isValid = false
      }
      
      return isValid
    },
    
    // 保存训练
    saveTraining() {
      if (!this.validateForm()) {
        return
      }
      
      // 转换日期格式
      const startTime = new Date(this.trainingForm.startTimeInput)
      const endTime = new Date(this.trainingForm.endTimeInput)
      
      const trainingData = {
        ...this.trainingForm,
        startTime,
        endTime
      }
      
      delete trainingData.startTimeInput
      delete trainingData.endTimeInput
      
      if (this.isCreating) {
        // 创建新训练
        const newTraining = {
          ...trainingData,
          id: Date.now() // 生成临时ID
        }
        
        this.trainings.unshift(newTraining)
        alert(`训练 ${newTraining.name} 创建成功！`)
      } else {
        // 更新现有训练
        const index = this.trainings.findIndex(t => t.id === trainingData.id)
        if (index !== -1) {
          this.trainings.splice(index, 1, trainingData)
          alert(`训练 ${trainingData.name} 更新成功！`)
        }
      }
      
      this.closeEditModal()
    },
    
    // 确认删除
    confirmDelete(training) {
      this.pendingDeleteTraining = training
      this.showDeleteConfirm = true
    },
    
    // 取消删除
    cancelDelete() {
      this.pendingDeleteTraining = null
      this.showDeleteConfirm = false
    },
    
    // 删除训练
    deleteTraining() {
      if (this.pendingDeleteTraining) {
        const index = this.trainings.findIndex(t => t.id === this.pendingDeleteTraining.id)
        if (index !== -1) {
          this.trainings.splice(index, 1)
          alert(`训练 ${this.pendingDeleteTraining.name} 已删除！`)
        }
      }
      
      this.cancelDelete()
      
      // 如果当前页没有数据了，尝试返回前一页
      if (this.filteredTrainings.length === 0 && this.currentPage > 1) {
        this.currentPage -= 1
      }
    }
  }
}
</script>

<style scoped>
.simulation-training-container {
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

/* 训练列表 */
.training-list {
  background-color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow-x: auto;
}

.training-table {
  width: 100%;
  border-collapse: collapse;
}

.training-table th, .training-table td {
  padding: 12px 8px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.training-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #595959;
}

.empty-data {
  text-align: center;
  color: #8c8c8c;
  padding: 32px 0;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.type-tag.guided {
  background-color: #e6f7ff;
  color: #1890ff;
}

.type-tag.combat {
  background-color: #fff1f0;
  color: #f5222d;
}

.type-tag.command {
  background-color: #fff7e6;
  color: #fa8c16;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-tag.planned {
  background-color: #f9f9f9;
  color: #8c8c8c;
}

.status-tag.ongoing {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-tag.completed {
  background-color: #f6ffed;
  color: #52c41a;
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

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-label {
  font-size: 14px;
  color: #8c8c8c;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: #262626;
  flex: 1;
}

.detail-value.description {
  white-space: pre-line;
  line-height: 1.5;
}

/* 参训人员列表 */
.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.participant-item {
  display: inline-block;
  padding: 4px 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 12px;
  color: #595959;
}

.empty-text {
  color: #8c8c8c;
}

/* 按钮样式 */
.close-btn, .edit-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
  border: none;
  margin-left: 10px;
}

.close-btn {
  background-color: #f9f9f9;
  color: #595959;
  border: 1px solid #d9d9d9;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group.half {
  flex: 0 0 calc(50% - 8px);
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

/* 参训人员输入 */
.participants-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-participant-btn {
  background: none;
  border: none;
  color: #f5222d;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-participant-btn {
  background: none;
  border: 1px dashed #d9d9d9;
  color: #1890ff;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 8px;
  text-align: center;
}

/* 按钮样式 */
.cancel-btn, .save-btn, .delete-confirm-btn {
  height: 32px;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
  border: none;
  margin-left: 10px;
}

.cancel-btn {
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

/* 删除确认弹窗样式 */
.delete-modal {
  width: 450px;
}

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