<template>
  <div class="teacher-review-container">
    <h1 class="page-title">教师点评</h1>

    <!-- 搜索和筛选区域 -->
    <div class="function-area">
      <div class="search-area">
        <input
          type="text"
          v-model="searchName"
          placeholder="输入人员姓名搜索"
          @input="filterScores"
        />
        <input
          type="text"
          v-model="searchCourse"
          placeholder="输入课程名称搜索"
          @input="filterScores"
        />
        <select v-model="classFilter" @change="filterScores">
          <option value="">所有班级</option>
          <option v-for="classItem in classList" :key="classItem.id" :value="classItem.id">
            {{ classItem.name }}
          </option>
        </select>
        <select v-model="timeFilter" @change="filterScores">
          <option value="">所有时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </div>
    </div>

    <!-- 成绩列表 -->
    <div class="score-list">
      <table>
        <thead>
          <tr>
            <th @click="sortBy('courseName')">
              课程名称
              <span class="sort-icon" v-if="sortField === 'courseName'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('time')">
              时间
              <span class="sort-icon" v-if="sortField === 'time'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>班级</th>
            <th>编组</th>
            <th>姓名</th>
            <th>任务完成情况</th>
            <th>用时(分钟)</th>
            <th @click="sortBy('score')">
              得分
              <span class="sort-icon" v-if="sortField === 'score'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="score in filteredScores" :key="score.id">
            <td>{{ score.courseName }}</td>
            <td>{{ formatDateTime(score.time) }}</td>
            <td>{{ score.className }}</td>
            <td>{{ score.groupName || '个人' }}</td>
            <td>{{ score.studentName }}</td>
            <td>
              <span class="status-tag" :class="getTaskStatus(score)">
                {{ getTaskStatusText(score) }}
              </span>
            </td>
            <td>{{ score.duration }}</td>
            <td>{{ showScore(score) }}</td>
            <td class="actions">
              <button 
                v-if="getTaskStatus(score) === 'pending'" 
                @click="startReview(score)"
                class="review-btn"
              >
                点评
              </button>
            </td>
          </tr>
          <tr v-if="filteredScores.length === 0">
            <td colspan="8" class="no-data">暂无待点评的成绩数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 点评弹窗 -->
    <div class="modal-backdrop" v-if="showReviewModal" @click="closeReviewModal"></div>
    <div class="modal review-modal" v-if="showReviewModal">
      <div class="modal-header">
        <h3>教员点评</h3>
        <button class="modal-close" @click="closeReviewModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-header">
          <div class="detail-info">
            <h4>{{ currentScore.courseName }}</h4>
            <div class="detail-meta">
              <span>{{ currentScore.studentName }}</span>
              <span>{{ currentScore.className }}</span>
              <span>{{ currentScore.groupName || '个人' }}</span>
              <span>课程角色：{{ currentScore.courseRole || '本控操作员' }}</span>
              <span>{{ formatDateTime(currentScore.time) }}</span>
            </div>
          </div>
          <div class="detail-score">
            <div class="score-input">
              <label>总分：</label>
              <input 
                type="number" 
                v-model.number="currentScore.score" 
                min="0" 
                max="100"
                @input="updateScore"
                class="score-number-input"
              />
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>任务节点</h4>
          <div class="task-nodes">
            <div v-for="(node, index) in currentScore.taskNodes" :key="index" class="task-node">
              <div class="node-header" @click="toggleNode(index)">
                <div class="node-number">{{ node.order }}</div>
                <div class="node-title">{{ node.name }}</div>
                <div class="node-time">{{ formatTime(node.timestamp) }}</div>
                <div class="node-status" :class="{ completed: node.completed }">
                  {{ node.completed ? '已完成' : '未完成' }}
                </div>
                <div class="node-toggle">{{ node.expanded ? '收起' : '展开' }}</div>
              </div>
              <div class="node-screenshot" v-if="node.screenshot && node.expanded">
                <img :src="node.screenshot" :alt="node.name">
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>点评内容</h4>
          <div class="review-form">
            <textarea
              v-model="currentScore.review"
              placeholder="请输入点评内容..."
              rows="4"
              class="review-textarea"
              @input="updateReview"
            ></textarea>
            <div class="form-error" v-if="reviewError">{{ reviewError }}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeReviewModal">取消</button>
        <button 
          class="submit-btn" 
          :disabled="!isFormValid()"
          @click="submitReview"
        >提交点评</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'TeacherReview',
  data() {
    return {
      // 搜索和筛选
      searchName: '',
      searchCourse: '',
      classFilter: '',
      timeFilter: '',
      
      // 排序
      sortField: 'time',
      sortOrder: 'desc',
      
      // 成绩列表
      scores: [],
      filteredScores: [],
      
      // 点评相关
      showReviewModal: false,
      reviewError: '',
      currentScore: {
        taskNodes: []
      },
      
      // 班级列表
      classList: [
        { id: 'class001', name: '新兵连一班' },
        { id: 'class002', name: '新兵连二班' },
        { id: 'class003', name: '特种作战班' },
        { id: 'class004', name: '通信技术班' }
      ]
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo
    })
  },
  created() {
    this.loadScores()
  },
  methods: {
    // 加载成绩列表
    loadScores() {
      // 模拟从API获取成绩数据
      const allScores = [
        {
          id: 'score001',
          courseId: 'ft001',
          courseName: '装甲车辆驾驶训练',
          classId: 'class001',
          className: '新兵连一班',
          groupId: '',
          groupName: '',
          studentId: 'student001',
          studentName: '张三',
          time: '2024-03-10T14:30:00',
          completionRate: 100,
          duration: 45,
          score: null,
          hasReview: false,
          review: '',
          reviewerName: '',
          reviewTime: '',
          taskNodes: [
            {
              order: 1,
              name: '开机',
              timestamp: '2024-03-10T14:30:10',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 2,
              name: '切换工作模式',
              timestamp: '2024-03-10T14:32:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 3,
              name: '生成高压',
              timestamp: '2024-03-10T14:35:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 4,
              name: '模拟行驶',
              timestamp: '2024-03-10T14:40:15',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80'
            }
          ]
        },
        {
          id: 'score002',
          courseId: 'ft002',
          courseName: '战场通信训练',
          classId: 'class003',
          className: '特种作战班',
          groupId: 'group001',
          groupName: '通信小组A',
          studentId: 'student002',
          studentName: '李四',
          time: '2024-03-12T10:15:00',
          completionRate: 85,
          duration: 60,
          score: null,
          hasReview: false,
          review: '',
          reviewerName: '',
          reviewTime: '',
          taskNodes: [
            {
              order: 1,
              name: '设备检查',
              timestamp: '2024-03-12T10:15:30',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 2,
              name: '建立通信链路',
              timestamp: '2024-03-12T10:20:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 3,
              name: '信息加密传输',
              timestamp: '2024-03-12T10:30:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 4,
              name: '应对干扰处理',
              timestamp: '2024-03-12T10:45:15',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3c5c?auto=format&fit=crop&w=400&q=80'
            }
          ]
        },
        {
          id: 'score003',
          courseId: 'ft003',
          courseName: '战术协同训练',
          classId: 'class004',
          className: '通信技术班',
          groupId: 'group002',
          groupName: '战术协同组B',
          studentId: 'student003',
          studentName: '王五',
          time: '2024-03-08T09:00:00',
          completionRate: 95,
          duration: 90,
          score: null,
          hasReview: false,
          review: '',
          reviewerName: '',
          reviewTime: '',
          taskNodes: [
            {
              order: 1,
              name: '任务部署',
              timestamp: '2024-03-08T09:00:30',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 2,
              name: '战术分析',
              timestamp: '2024-03-08T09:15:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 3,
              name: '协同行动',
              timestamp: '2024-03-08T09:30:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80'
            },
            {
              order: 4,
              name: '任务总结',
              timestamp: '2024-03-08T10:00:15',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80'
            }
          ]
        }
      ]
      
      // 根据用户角色过滤可见的成绩
      if (this.userInfo.role === 'admin') {
        // 管理员可以看到所有成绩
        this.scores = allScores
      } else if (this.userInfo.role === 'teacher') {
        // 教师只能看到自己所教班级的成绩
        this.scores = allScores.filter(score => 
          ['class001', 'class003'].includes(score.classId)
        )
      }
      
      this.filterScores()
    },
    
    // 过滤成绩列表
    filterScores() {
      let filtered = [...this.scores]
      
      // 只显示待点评的成绩
      filtered = filtered.filter(score => this.getTaskStatus(score) === 'pending')
      
      // 姓名搜索
      if (this.searchName) {
        const keyword = this.searchName.toLowerCase()
        filtered = filtered.filter(score => 
          score.studentName.toLowerCase().includes(keyword)
        )
      }
      
      // 课程名称搜索
      if (this.searchCourse) {
        const keyword = this.searchCourse.toLowerCase()
        filtered = filtered.filter(score => 
          score.courseName.toLowerCase().includes(keyword)
        )
      }
      
      // 班级筛选
      if (this.classFilter) {
        filtered = filtered.filter(score => 
          score.classId === this.classFilter
        )
      }
      
      // 时间筛选
      if (this.timeFilter) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        
        filtered = filtered.filter(score => {
          const scoreDate = new Date(score.time)
          if (this.timeFilter === 'today') {
            return scoreDate >= today
          } else if (this.timeFilter === 'week') {
            return scoreDate >= weekStart
          } else if (this.timeFilter === 'month') {
            return scoreDate >= monthStart
          }
          return true
        })
      }
      
      // 应用排序
      this.applySorting(filtered)
    },
    
    // 排序
    sortBy(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortOrder = 'asc'
      }
      
      this.filterScores()
    },
    
    // 应用排序
    applySorting(filtered) {
      filtered.sort((a, b) => {
        let compareResult = 0
        
        if (this.sortField === 'courseName') {
          compareResult = a.courseName.localeCompare(b.courseName)
        } else if (this.sortField === 'time') {
          compareResult = new Date(a.time) - new Date(b.time)
        } else if (this.sortField === 'score') {
          // 处理得分为 null 的情况
          const scoreA = a.score === null ? -1 : a.score
          const scoreB = b.score === null ? -1 : b.score
          compareResult = scoreA - scoreB
        }
        
        return this.sortOrder === 'asc' ? compareResult : -compareResult
      })
      
      this.filteredScores = filtered
    },
    
    // 开始点评
    startReview(score) {
      this.currentScore = { ...score }
      // 初始化所有节点为折叠状态
      this.currentScore.taskNodes = this.currentScore.taskNodes.map(node => ({
        ...node,
        expanded: false
      }))
      this.currentScore.score = this.currentScore.score || 0
      this.currentScore.review = this.currentScore.review || ''
      this.showReviewModal = true
      this.reviewError = ''
    },
    
    // 提交点评
    async submitReview() {
      // 表单验证
      if (!this.currentScore.score || this.currentScore.score < 0 || this.currentScore.score > 100) {
        this.reviewError = '请输入0-100之间的分数'
        return
      }
      if (!this.currentScore.review || this.currentScore.review.trim().length < 10) {
        this.reviewError = '点评内容不能少于10个字'
        return
      }
      
      try {
        // 更新当前详情的点评信息
        this.currentScore = {
          ...this.currentScore,
          hasReview: true,
          reviewerName: this.userInfo.name,
          reviewTime: new Date().toISOString()
        }
        
        // 更新列表中的成绩信息
        const index = this.scores.findIndex(s => s.id === this.currentScore.id)
        if (index !== -1) {
          this.scores[index] = { ...this.currentScore }
          this.filterScores()
        }
        
        this.$message.success('点评提交成功')
        this.closeReviewModal()
      } catch (error) {
        console.error('点评提交失败:', error)
        this.$message.error('点评提交失败，请重试')
      }
    },
    
    // 更新分数
    updateScore(event) {
      const score = parseInt(event.target.value)
      if (!isNaN(score)) {
        this.currentScore.score = Math.min(100, Math.max(0, score))
      }
      this.reviewError = ''
    },
    
    // 更新点评内容
    updateReview(event) {
      this.currentScore.review = event.target.value
      this.reviewError = ''
    },
    
    // 任务状态
    getTaskStatus(score) {
      if (!score.taskNodes || score.taskNodes.some(n => !n.completed)) {
        return 'not-finished'
      } else if (!score.hasReview) {
        return 'pending'
      } else {
        return 'reviewed'
      }
    },
    
    getTaskStatusText(score) {
      const status = this.getTaskStatus(score)
      if (status === 'not-finished') return '未完成'
      if (status === 'pending') return '待点评'
      if (status === 'reviewed') return '已点评'
      return ''
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    // 格式化时间
    formatTime(dateString) {
      const date = new Date(dateString)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    },
    
    // 切换节点展开状态
    toggleNode(index) {
      this.$set(this.currentScore.taskNodes[index], 'expanded', !this.currentScore.taskNodes[index].expanded)
    },
    
    // 关闭点评弹窗
    closeReviewModal() {
      this.showReviewModal = false
      this.reviewError = ''
    },
    
    // 表单验证
    isFormValid() {
      return this.currentScore.score >= 0 && 
             this.currentScore.score <= 100 && 
             this.currentScore.review && 
             this.currentScore.review.trim().length >= 10
    },

    // 在 methods 中添加 showScore 方法
    showScore(score) {
      const status = this.getTaskStatus(score)
      if (status !== 'reviewed') return '-'
      return score.score
    }
  }
}
</script>

<style scoped>
/* 复用成绩查询页面的样式 */
.teacher-review-container {
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
  width: 200px;
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

/* 成绩列表 */
.score-list {
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
  cursor: pointer;
}

th:hover {
  background-color: #f0f0f0;
}

.sort-icon {
  margin-left: 4px;
  color: #1890ff;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
}

.status-tag.not-finished {
  background-color: #ff4d4f;
}

.status-tag.pending {
  background-color: #faad14;
}

.status-tag.reviewed {
  background-color: #52c41a;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
}

.review-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.review-btn:hover {
  background-color: #40a9ff;
}

.no-data {
  text-align: center;
  color: #8c8c8c;
  padding: 30px 0;
}

/* 弹窗样式 */
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
  width: 800px;
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

/* 详情样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.detail-info h4 {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.detail-meta {
  display: flex;
  gap: 16px;
  color: #8c8c8c;
}

.detail-score {
  text-align: right;
}

.score-number-input {
  width: 80px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
}

.score-number-input:focus {
  border-color: #409eff;
  outline: none;
}

/* 任务节点 */
.task-nodes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-node {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #fafafa;
  cursor: pointer;
}

.node-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 12px;
}

.node-title {
  flex: 1;
  font-weight: 500;
}

.node-time {
  margin-right: 12px;
  color: #8c8c8c;
}

.node-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  background-color: #ff4d4f;
  color: white;
  margin-right: 12px;
}

.node-status.completed {
  background-color: #52c41a;
}

.node-screenshot {
  padding: 16px;
}

.node-screenshot img {
  width: 100%;
  border-radius: 4px;
}

/* 点评表单 */
.review-form {
  margin-top: 15px;
}

.review-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.review-textarea:focus {
  border-color: #409eff;
  outline: none;
}

.form-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}

/* 弹窗底部 */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.submit-btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  border: 1px solid #dcdfe6;
  background-color: white;
  color: #606266;
}

.cancel-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.submit-btn {
  border: none;
  background-color: #409eff;
  color: white;
}

.submit-btn:hover {
  background-color: #66b1ff;
}

.submit-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style> 