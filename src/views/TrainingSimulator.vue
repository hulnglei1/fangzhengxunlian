<template>
  <div class="training-simulator">
    <div class="simulator-header">
      <div class="back-button" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </div>
      <div class="training-info">
        <h2>{{ trainingName }}</h2>
        <div class="training-meta">
          <span class="category-tag">{{ categoryName }}</span>
          <span class="time-counter">已训练时间: {{ formatTime(elapsedTime) }}</span>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" @click="toggleFullscreen">
          <span class="icon">⛶</span>
          全屏
        </button>
        <button class="control-btn" @click="exitTraining">
          <span class="icon">⏹</span>
          结束训练
        </button>
      </div>
    </div>
    
    <div class="simulator-container">
      <div class="simulator-frame">
        <div class="placeholder-content">
          <div class="simulator-placeholder">
            <div class="placeholder-icon">🖥️</div>
            <div class="placeholder-text">训练模拟器界面</div>
            <div class="placeholder-loading">
              正在加载仿真环境...{{ progress }}%
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 退出确认弹窗 -->
    <div class="modal-backdrop" v-if="showExitConfirm" @click="cancelExit"></div>
    <div class="modal exit-modal" v-if="showExitConfirm">
      <div class="modal-header">
        <h3>确认退出训练</h3>
        <button class="modal-close" @click="cancelExit">&times;</button>
      </div>
      <div class="modal-body">
        <p>确定要退出当前训练吗？</p>
        <p class="warning-text">退出后将保存当前进度 {{ progress }}%</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelExit">继续训练</button>
        <button class="confirm-btn" @click="confirmExit">确认退出</button>
      </div>
    </div>
    
    <!-- 训练完成弹窗 -->
    <div class="modal-backdrop" v-if="showCompletionModal"></div>
    <div class="modal completion-modal" v-if="showCompletionModal">
      <div class="modal-header">
        <h3>训练完成</h3>
      </div>
      <div class="modal-body">
        <div class="completion-info">
          <div class="score-display">
            <div class="score">{{ trainingScore }}</div>
            <div class="score-label">得分</div>
          </div>
          <div class="completion-details">
            <div class="detail-item">
              <div class="detail-label">训练名称:</div>
              <div class="detail-value">{{ trainingName }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">训练时长:</div>
              <div class="detail-value">{{ formatTime(elapsedTime) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">完成时间:</div>
              <div class="detail-value">{{ getCurrentDateTime() }}</div>
            </div>
          </div>
        </div>
        <div class="feedback-section">
          <h4>训练评价</h4>
          <div class="feedback-item">
            <div class="feedback-icon good">✓</div>
            <div class="feedback-content">
              <div class="feedback-title">操作熟练度良好</div>
              <div class="feedback-description">基本操作流程掌握准确，动作协调性良好</div>
            </div>
          </div>
          <div class="feedback-item">
            <div class="feedback-icon neutral">!</div>
            <div class="feedback-content">
              <div class="feedback-title">紧急情况处理需加强</div>
              <div class="feedback-description">在应对突发状况时反应速度有待提高</div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="confirm-btn" @click="returnToList">返回列表</button>
        <button class="restart-btn" @click="restartTraining">再次训练</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrainingSimulator',
  data() {
    return {
      trainingId: null,
      trainingName: '训练模拟',
      categoryName: '装备操作',
      elapsedTime: 0,
      progress: 0,
      timerInterval: null,
      progressInterval: null,
      
      showExitConfirm: false,
      showCompletionModal: false,
      
      trainingScore: 86
    };
  },
  created() {
    this.initTrainingParameters();
    this.startTimer();
    this.simulateProgress();
  },
  beforeDestroy() {
    this.clearIntervals();
  },
  methods: {
    initTrainingParameters() {
      const { trainingId, trainingName, categoryId, categoryName } = this.$route.query;
      
      this.trainingId = trainingId || null;
      this.trainingName = trainingName || '未指定训练';
      
      if (categoryName) {
        this.categoryName = categoryName;
      }
    },
    
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.elapsedTime += 1;
      }, 1000);
    },
    
    simulateProgress() {
      this.progressInterval = setInterval(() => {
        if (this.progress < 100) {
          this.progress += Math.floor(Math.random() * 3) + 1;
          if (this.progress > 100) {
            this.progress = 100;
          }
        } else {
          clearInterval(this.progressInterval);
          setTimeout(() => {
            this.showCompletionModal = true;
          }, 1000);
        }
      }, 1500);
    },
    
    clearIntervals() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    getCurrentDateTime() {
      const now = new Date();
      return now.toLocaleString('zh-CN');
    },
    
    goBack() {
      this.exitTraining();
    },
    
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    },
    
    exitTraining() {
      this.showExitConfirm = true;
    },
    
    cancelExit() {
      this.showExitConfirm = false;
    },
    
    confirmExit() {
      this.clearIntervals();
      this.$router.push('/free-training');
    },
    
    returnToList() {
      this.clearIntervals();
      this.$router.push('/free-training');
    },
    
    restartTraining() {
      this.clearIntervals();
      this.progress = 0;
      this.elapsedTime = 0;
      this.showCompletionModal = false;
      this.startTimer();
      this.simulateProgress();
    }
  }
}
</script>

<style scoped>
.training-simulator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 2000;
  color: white;
  display: flex;
  flex-direction: column;
}

.simulator-header {
  padding: 15px 20px;
  background-color: #0C2D48;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 5px;
}

.back-icon {
  font-size: 18px;
}

.training-info {
  text-align: center;
}

.training-info h2 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.training-meta {
  display: flex;
  gap: 15px;
  justify-content: center;
  font-size: 14px;
}

.category-tag {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.controls {
  display: flex;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.icon {
  font-size: 16px;
}

.simulator-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #121212;
  overflow: hidden;
}

.simulator-frame {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.simulator-placeholder {
  text-align: center;
  color: #aaa;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.placeholder-text {
  font-size: 20px;
  margin-bottom: 20px;
}

.placeholder-loading {
  font-size: 14px;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s;
}

/* 弹窗样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2001;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 2002;
  width: 500px;
  max-width: 90%;
  color: #333;
}

.exit-modal {
  width: 400px;
}

.completion-modal {
  width: 600px;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
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
  padding: 15px 20px;
  border-top: 1px solid #e8e8e8;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.warning-text {
  color: #faad14;
  font-weight: 500;
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

.restart-btn {
  padding: 6px 16px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 完成信息样式 */
.completion-info {
  display: flex;
  margin-bottom: 25px;
}

.score-display {
  flex: 0 0 120px;
  text-align: center;
  border-right: 1px solid #e8e8e8;
  padding-right: 20px;
}

.score {
  font-size: 42px;
  font-weight: bold;
  color: #1890ff;
}

.score-label {
  margin-top: 5px;
  color: #8c8c8c;
}

.completion-details {
  flex: 1;
  padding-left: 20px;
}

.detail-item {
  display: flex;
  margin-bottom: 10px;
}

.detail-label {
  flex: 0 0 80px;
  color: #8c8c8c;
}

.detail-value {
  flex: 1;
  font-weight: 500;
}

/* 反馈样式 */
.feedback-section {
  border-top: 1px solid #e8e8e8;
  padding-top: 15px;
}

.feedback-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.feedback-item {
  display: flex;
  margin-bottom: 15px;
}

.feedback-icon {
  flex: 0 0 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  color: white;
  font-weight: bold;
}

.feedback-icon.good {
  background-color: #52c41a;
}

.feedback-icon.neutral {
  background-color: #faad14;
}

.feedback-icon.bad {
  background-color: #f5222d;
}

.feedback-content {
  flex: 1;
}

.feedback-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.feedback-description {
  font-size: 14px;
  color: #5c5c5c;
}
</style> 