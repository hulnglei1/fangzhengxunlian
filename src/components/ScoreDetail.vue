<template>
  <div class="score-detail">
    <div class="detail-header">
      <div class="detail-info">
        <h4>{{ detail.courseName }}</h4>
        <div class="detail-meta">
          <span>{{ detail.studentName }}</span>
          <span>{{ detail.className }}</span>
          <span>{{ detail.groupName || '个人' }}</span>
          <span>课程角色：{{ detail.courseRole || '本控操作员' }}</span>
          <span>{{ formatDateTime(detail.time) }}</span>
        </div>
      </div>
      <div class="detail-score">
        <template v-if="editable">
          <div class="score-input">
            <label>总分：</label>
            <input 
              type="number" 
              v-model.number="localScore" 
              min="0" 
              max="100"
              @input="updateScore"
            />
          </div>
        </template>
        <template v-else>
          <div class="score-circle">
            <span>{{ detail.score }}</span>
          </div>
          <div>总分</div>
        </template>
      </div>
    </div>

    <div class="detail-section">
      <h4>任务节点</h4>
      <div class="task-nodes">
        <div v-for="(node, index) in localNodes" :key="index" class="task-node">
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
        <template v-if="editable">
          <textarea
            v-model="localReview"
            placeholder="请输入点评内容..."
            rows="4"
            class="review-textarea"
            @input="updateReview"
          ></textarea>
        </template>
        <template v-else>
          <div v-if="detail.hasReview" class="review-text">
            {{ detail.review }}
            <div class="review-meta">
              <span>点评教师：{{ detail.reviewerName }}</span>
              <span>点评时间：{{ formatDateTime(detail.reviewTime) }}</span>
            </div>
          </div>
          <div v-else class="no-review">
            <p>该成绩尚未点评</p>
            <button v-if="canReview" class="review-btn" @click="$emit('review')">进行点评</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScoreDetail',
  props: {
    detail: {
      type: Object,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    canReview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localNodes: [],
      localScore: 0,
      localReview: ''
    }
  },
  watch: {
    detail: {
      immediate: true,
      handler(newDetail) {
        this.localNodes = (newDetail.taskNodes || []).map(node => ({
          ...node,
          expanded: false
        }))
        this.localScore = newDetail.score
        this.localReview = newDetail.review || ''
      }
    }
  },
  methods: {
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    toggleNode(index) {
      this.$set(this.localNodes[index], 'expanded', !this.localNodes[index].expanded)
    },
    updateScore() {
      this.$emit('update:score', this.localScore)
    },
    updateReview() {
      this.$emit('update:review', this.localReview)
    }
  }
}
</script>

<style scoped>
.score-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.detail-meta {
  display: flex;
  gap: 16px;
  color: #666;
  margin-top: 8px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
}

.score-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input input {
  width: 60px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.detail-section {
  margin-bottom: 20px;
}

.task-nodes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-node {
  border: 1px solid #eee;
  border-radius: 4px;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  background: #f5f7fa;
}

.node-number {
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.node-title {
  flex: 1;
}

.node-time {
  color: #666;
  margin-right: 12px;
}

.node-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 12px;
}

.node-status.completed {
  background: #e1f3d8;
  color: #67c23a;
}

.node-toggle {
  color: #409eff;
}

.node-screenshot {
  padding: 12px;
}

.node-screenshot img {
  max-width: 100%;
  border-radius: 4px;
}

.review-content {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.review-text {
  color: #333;
  line-height: 1.6;
}

.review-meta {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
  display: flex;
  gap: 16px;
}

.no-review {
  text-align: center;
  color: #666;
}

.review-btn {
  margin-top: 12px;
  padding: 8px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.review-btn:hover {
  background: #66b1ff;
}
</style> 