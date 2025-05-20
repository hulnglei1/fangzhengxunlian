<template>
  <div class="score-query-container">
    <h1 class="page-title">成绩查询</h1>

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
              <button class="detail-btn" @click="viewScoreDetail(score)">查看详情</button>
              <button 
                v-if="canReview && getTaskStatus(score) === 'pending'" 
                @click="goToReview(score)"
                class="review-btn"
              >
                点评
              </button>
            </td>
          </tr>
          <tr v-if="filteredScores.length === 0">
            <td colspan="10" class="no-data">暂无成绩数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 成绩详情弹窗 -->
    <div class="modal-backdrop" v-if="showDetailModal" @click="closeDetailModal"></div>
    <div class="modal detail-modal" v-if="showDetailModal">
      <div class="modal-header">
        <h3>{{ isReviewMode ? '教员点评' : '成绩详情' }}</h3>
        <button class="modal-close" @click="closeDetailModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-header">
          <div class="detail-info">
            <h4>{{ currentDetail.courseName }}</h4>
            <div class="detail-meta">
              <span>{{ currentDetail.studentName }}</span>
              <span>{{ currentDetail.className }}</span>
              <span>{{ currentDetail.groupName || '个人' }}</span>
              <span>课程角色：{{ currentDetail.courseRole || '本控操作员' }}</span>
              <span>{{ formatDateTime(currentDetail.time) }}</span>
            </div>
          </div>
          <div class="detail-score">
            <div v-if="isReviewMode" class="score-input">
              <label>总分：</label>
              <input 
                type="number" 
                v-model.number="currentDetail.score" 
                min="0" 
                max="100"
                @input="updateScore"
                class="score-number-input"
              />
            </div>
            <div v-else>
              <div class="score-circle">
                <span>{{ currentDetail.score || '-' }}</span>
              </div>
              <div>总分</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>任务节点</h4>
          <div class="task-nodes">
            <div v-for="(node, index) in currentDetail.taskNodes" :key="index" class="task-node">
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
          <h4>教师点评</h4>
          <div class="review-content">
            <div v-if="isReviewMode" class="review-form">
              <textarea
                v-model="currentDetail.review"
                placeholder="请输入点评内容..."
                rows="4"
                class="review-textarea"
                @input="updateReview"
              ></textarea>
              <div class="form-error" v-if="reviewError">{{ reviewError }}</div>
            </div>
            <div v-else>
              <div v-if="currentDetail.hasReview" class="review-text">
                {{ currentDetail.review }}
                <div class="review-meta">
                  <span>点评教师：{{ currentDetail.reviewerName }}</span>
                  <span>点评时间：{{ formatDateTime(currentDetail.reviewTime) }}</span>
                </div>
              </div>
              <div v-else-if="canReview" class="no-review">
                <p>该成绩尚未点评</p>
                <button class="review-btn" @click="startReview">进行点评</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div v-if="isReviewMode">
          <button class="cancel-btn" @click="closeDetailModal">取消</button>
          <button 
            class="submit-btn" 
            :disabled="!isFormValid()"
            @click="submitReview"
          >提交点评</button>
        </div>
        <div v-else>
          <button class="confirm-btn" @click="closeDetailModal">关闭</button>
          <button 
            v-if="canReview && !currentDetail.hasReview" 
            class="review-btn"
            @click="startReview"
          >进行点评</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScoreQuery',
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
      
      // 弹窗控制
      showDetailModal: false,
      
      // 当前查看的详情
      currentDetail: {
        taskNodes: []
      },
      
      // 班级列表
      classList: [
        { id: 'class001', name: '新兵连一班' },
        { id: 'class002', name: '新兵连二班' },
        { id: 'class003', name: '特种作战班' },
        { id: 'class004', name: '通信技术班' }
      ],

      // 点评模式
      isReviewMode: false,
      
      // 点评表单
      reviewForm: {
        score: null,
        review: ''
      },
      
      // 点评表单验证规则
      reviewRules: {
        score: [
          { required: true, message: '请输入分数', trigger: 'blur' },
          { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间', trigger: 'blur' }
        ],
        review: [
          { required: true, message: '请输入点评内容', trigger: 'blur' },
          { min: 10, max: 500, message: '点评内容长度应在10-500字之间', trigger: 'blur' }
        ]
      },
      
      // 点评相关
      reviewError: ''
    };
  },
  computed: {
    // 是否有点评权限
    canReview() {
      return this.userInfo.role === 'admin' || this.userInfo.role === 'teacher';
    }
  },
  created() {
    this.loadScores();
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
          time: '2023-12-10T14:30:00',
          completionRate: 100,
          duration: 45,
          score: 92,
          hasReview: true,
          review: '操作熟练，反应迅速，但在紧急情况下的处理还需加强。',
          reviewerName: '李教官',
          reviewTime: '2023-12-10T16:20:00',
          taskNodes: [
            {
              order: 1,
              name: '开机',
              timestamp: '2023-12-10T14:30:10',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' // 装甲车外观
            },
            {
              order: 2,
              name: '切换工作模式',
              timestamp: '2023-12-10T14:32:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80' // 仿真驾驶舱
            },
            {
              order: 3,
              name: '生成高压',
              timestamp: '2023-12-10T14:35:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' // 控制面板
            },
            {
              order: 4,
              name: '模拟行驶',
              timestamp: '2023-12-10T14:40:15',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80' // 行驶场景
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
          time: '2023-12-12T10:15:00',
          completionRate: 85,
          duration: 60,
          score: 78,
          hasReview: false,
          review: '',
          reviewerName: '',
          reviewTime: '',
          taskNodes: [
            {
              order: 1,
              name: '设备检查',
              timestamp: '2023-12-12T10:15:30',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80' // 通信设备
            },
            {
              order: 2,
              name: '建立通信链路',
              timestamp: '2023-12-12T10:20:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' // 通信线路
            },
            {
              order: 3,
              name: '信息加密传输',
              timestamp: '2023-12-12T10:30:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' // 加密界面
            },
            {
              order: 4,
              name: '应对干扰处理',
              timestamp: '2023-12-12T10:45:15',
              completed: false,
              screenshot: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3c5c?auto=format&fit=crop&w=400&q=80' // 干扰场景
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
          time: '2023-12-08T09:00:00',
          completionRate: 95,
          duration: 90,
          score: 88,
          hasReview: true,
          review: '团队协作能力强，指挥决策明确，但战术配合的时机把握还需提高。',
          reviewerName: '张教官',
          reviewTime: '2023-12-08T11:30:00',
          taskNodes: [
            {
              order: 1,
              name: '任务部署',
              timestamp: '2023-12-08T09:00:30',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' // 战术部署
            },
            {
              order: 2,
              name: '战术分析',
              timestamp: '2023-12-08T09:15:45',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80' // 分析场景
            },
            {
              order: 3,
              name: '协同行动',
              timestamp: '2023-12-08T09:30:20',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' // 协同作战
            },
            {
              order: 4,
              name: '任务总结',
              timestamp: '2023-12-08T10:00:15',
              completed: true,
              screenshot: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80' // 总结场景
            }
          ]
        }
      ];
      
      // 根据用户角色过滤可见的成绩
      if (this.userInfo.userType === 'admin') {
        // 管理员可以看到所有成绩
        this.scores = allScores;
      } else if (this.userInfo.userType === 'teacher') {
        // 教师只能看到自己所教班级的成绩
        // 这里模拟教师只能看到特定班级的成绩
        this.scores = allScores.filter(score => 
          ['class001', 'class003'].includes(score.classId)
        );
      } else {
        // 学员只能看到自己的成绩
        // 这里模拟当前登录的学员是张三
        this.scores = allScores.filter(score => 
          score.studentId === 'student001'
        );
      }
      
      this.filterScores();
    },
    
    // 过滤成绩列表
    filterScores() {
      let filtered = [...this.scores];
      
      // 姓名搜索
      if (this.searchName) {
        const keyword = this.searchName.toLowerCase();
        filtered = filtered.filter(score => 
          score.studentName.toLowerCase().includes(keyword)
        );
      }
      
      // 课程名称搜索
      if (this.searchCourse) {
        const keyword = this.searchCourse.toLowerCase();
        filtered = filtered.filter(score => 
          score.courseName.toLowerCase().includes(keyword)
        );
      }
      
      // 班级筛选
      if (this.classFilter) {
        filtered = filtered.filter(score => 
          score.classId === this.classFilter
        );
      }
      
      // 时间筛选
      if (this.timeFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        filtered = filtered.filter(score => {
          const scoreDate = new Date(score.time);
          if (this.timeFilter === 'today') {
            return scoreDate >= today;
          } else if (this.timeFilter === 'week') {
            return scoreDate >= weekStart;
          } else if (this.timeFilter === 'month') {
            return scoreDate >= monthStart;
          }
          return true;
        });
      }
      
      // 应用排序
      this.applySorting(filtered);
    },
    
    // 排序
    sortBy(field) {
      if (this.sortField === field) {
        // 如果已经按照这个字段排序，则切换排序顺序
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        // 否则切换排序字段，并默认为升序
        this.sortField = field;
        this.sortOrder = 'asc';
      }
      
      this.filterScores();
    },
    
    // 应用排序
    applySorting(filtered) {
      filtered.sort((a, b) => {
        let compareResult = 0;
        
        if (this.sortField === 'courseName') {
          compareResult = a.courseName.localeCompare(b.courseName);
        } else if (this.sortField === 'time') {
          compareResult = new Date(a.time) - new Date(b.time);
        } else if (this.sortField === 'score') {
          compareResult = a.score - b.score;
        }
        
        return this.sortOrder === 'asc' ? compareResult : -compareResult;
      });
      
      this.filteredScores = filtered;
    },
    
    // 查看成绩详情
    viewScoreDetail(score) {
      this.currentDetail = { ...score };
      // 初始化所有节点为折叠状态
      this.currentDetail.taskNodes = this.currentDetail.taskNodes.map(node => ({
        ...node,
        expanded: false
      }));
      
      // 如果是待点评状态，初始化点评表单
      if (this.canReview && !score.hasReview) {
        this.reviewForm.score = null;
        this.reviewForm.review = '';
        if (this.$refs.reviewForm) {
          this.$refs.reviewForm.resetFields();
        }
      }
      
      this.showDetailModal = true;
    },
    
    // 前往点评页面
    goToReview(score) {
      this.currentDetail = { ...score };
      // 初始化所有节点为折叠状态
      this.currentDetail.taskNodes = this.currentDetail.taskNodes.map(node => ({
        ...node,
        expanded: false
      }));
      this.currentDetail.score = this.currentDetail.score || 0;
      this.currentDetail.review = this.currentDetail.review || '';
      this.showDetailModal = true;
      this.isReviewMode = true;
    },
    
    // 提交点评
    async submitReview() {
      try {
        await this.$refs.reviewForm.validate();
        
        // 更新当前详情的点评信息
        this.currentDetail = {
          ...this.currentDetail,
          hasReview: true,
          score: this.reviewForm.score,
          review: this.reviewForm.review,
          reviewerName: this.userInfo.name,
          reviewTime: new Date().toISOString()
        };
        
        // 更新列表中的成绩信息
        const index = this.scores.findIndex(s => s.id === this.currentDetail.id);
        if (index !== -1) {
          this.scores[index] = { ...this.currentDetail };
          this.filterScores();
        }
        
        // 重置表单
        this.reviewForm.score = null;
        this.reviewForm.review = '';
        this.$refs.reviewForm.resetFields();
        
        this.$message.success('点评提交成功');
      } catch (error) {
        console.error('点评提交失败:', error);
        this.$message.error('点评提交失败，请重试');
      }
    },

    // 更新分数
    updateScore(event) {
      const score = parseInt(event.target.value);
      if (!isNaN(score)) {
        this.currentDetail.score = Math.min(100, Math.max(0, score));
      }
    },
    
    // 任务状态
    getTaskStatus(score) {
      if (!score.taskNodes || score.taskNodes.some(n => !n.completed)) {
        return 'not-finished';
      } else if (!score.hasReview) {
        return 'pending';
      } else {
        return 'reviewed';
      }
    },
    getTaskStatusText(score) {
      const status = this.getTaskStatus(score);
      if (status === 'not-finished') return '未完成';
      if (status === 'pending') return '待点评';
      if (status === 'reviewed') return '已点评';
      return '';
    },
    // 分数显示
    showScore(score) {
      const status = this.getTaskStatus(score);
      if (status !== 'reviewed') return '-';
      return score.score;
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    
    // 格式化时间
    formatTime(dateString) {
      const date = new Date(dateString);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    },
    toggleNode(index) {
      this.$set(this.currentDetail.taskNodes[index], 'expanded', !this.currentDetail.taskNodes[index].expanded);
    },
    closeDetailModal() {
      this.showDetailModal = false;
      this.isReviewMode = false;
      this.reviewError = '';
    },
    startReview() {
      this.isReviewMode = true;
      if (!this.currentDetail.score) {
        this.currentDetail.score = 0;
      }
      if (!this.currentDetail.review) {
        this.currentDetail.review = '';
      }
    },
    updateReview(event) {
      this.currentDetail.review = event.target.value;
    },
    isFormValid() {
      return this.reviewForm.score !== null && this.reviewForm.review.trim() !== '';
    }
  }
};
</script>

<style scoped>
.score-query-container {
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

.review-btn {
  background-color: #fff;
  color: #1890ff;
  border: 2px solid #1890ff;
  font-weight: bold;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 15px;
  transition: all 0.2s;
}

.review-btn:hover {
  background-color: #1890ff;
  color: #fff;
}

.detail-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 15px;
  font-weight: bold;
  margin-right: 8px;
  transition: all 0.2s;
}

.detail-btn:hover {
  background-color: #40a9ff;
}

.no-data {
  text-align: center;
  color: #8c8c8c;
  padding: 30px 0;
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

.modal-footer {
  padding: 10px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 详情样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  text-align: center;
}

.score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 16px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
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

/* 点评表单样式 */
.review-form {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.score-input {
  width: 180px;
}

.review-textarea {
  width: 100%;
  margin-top: 15px;
}

.review-actions {
  margin-top: 20px;
  text-align: right;
}

.review-content {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.review-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
}

.review-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 点评相关样式 */
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover,
.confirm-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.submit-btn {
  padding: 8px 20px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background-color: #409eff;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.submit-btn:disabled {
  background-color: #a0cfff;
  border-color: #a0cfff;
  cursor: not-allowed;
}

.review-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.review-text {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 10px;
}

.review-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}
</style> 