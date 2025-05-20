<template>
  <div class="dashboard-container">
    <h1 class="page-title">仪表盘</h1>
    <div class="dashboard-welcome">
      <div class="welcome-message">
        欢迎使用军方仿真训练管理系统
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">学员总数</div>
        <div class="stat-value">125</div>
        <div class="stat-trend up">↑ 5% 较上月</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">活跃班组</div>
        <div class="stat-value">8</div>
        <div class="stat-trend">较上月持平</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">训练完成率</div>
        <div class="stat-value">82%</div>
        <div class="stat-trend up">↑ 3% 较上月</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">平均通过分数</div>
        <div class="stat-value">87</div>
        <div class="stat-trend down">↓ 2% 较上月</div>
      </div>
    </div>
    <div class="dashboard-row">
      <div class="dashboard-col">
        <div class="dashboard-panel">
          <div class="panel-header">
            <h3>最近训练活动</h3>
          </div>
          <div class="panel-body">
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon completed">✓</div>
                <div class="activity-content">
                  <div class="activity-title">张学员 完成了 "装甲车辆驾驶训练"</div>
                  <div class="activity-time">今天 14:30</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon started">→</div>
                <div class="activity-content">
                  <div class="activity-title">特种作战班 开始了 "VR战场环境适应训练"</div>
                  <div class="activity-time">今天 10:15</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon completed">✓</div>
                <div class="activity-content">
                  <div class="activity-title">新兵连一班 完成了 "战术通信训练"</div>
                  <div class="activity-time">昨天 16:45</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon started">→</div>
                <div class="activity-content">
                  <div class="activity-title">李学员 开始了 "战场急救技能"</div>
                  <div class="activity-time">昨天 09:20</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-col">
        <div class="dashboard-panel">
          <div class="panel-header">
            <h3>系统公告</h3>
          </div>
          <div class="panel-body">
            <div class="notice-list">
              <div class="notice-item">
                <div class="notice-title">系统升级通知</div>
                <div class="notice-content">
                  为提升系统性能和用户体验，将于本周五晚上22:00-24:00进行系统维护升级，期间部分功能可能暂时无法使用。
                </div>
                <div class="notice-time">2023-12-05</div>
              </div>
              <div class="notice-item">
                <div class="notice-title">新增训练模块上线</div>
                <div class="notice-content">
                  新的多兵种协同作战训练模块已正式上线，欢迎各单位学员体验。
                </div>
                <div class="notice-time">2023-11-28</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a1a;
}

.dashboard-welcome {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.welcome-message {
  font-size: 18px;
  color: #1a1a1a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-title {
  color: #8c8c8c;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.stat-trend {
  font-size: 12px;
  color: #8c8c8c;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #f5222d;
}

.dashboard-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-col {
  flex: 1;
}

.dashboard-panel {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-body {
  padding: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
}

.activity-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  color: white;
  flex-shrink: 0;
}

.activity-icon.completed {
  background-color: #52c41a;
}

.activity-icon.started {
  background-color: #1890ff;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #8c8c8c;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notice-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}

.notice-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.notice-title {
  font-weight: 500;
  margin-bottom: 10px;
}

.notice-content {
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.notice-time {
  font-size: 12px;
  color: #8c8c8c;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 