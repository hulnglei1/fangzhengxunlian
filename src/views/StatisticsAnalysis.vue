<template>
  <div class="statistics-analysis-container">
    <h1 class="page-title">统计分析</h1>
    <div class="top-bar">
      <div class="year-select">
        <label>年份：</label>
        <select v-model="selectedYear" @change="onYearChange">
          <option v-for="year in yearList" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>
    <div class="charts-grid">
      <!-- 课程成绩分布 -->
      <div class="chart-card">
        <div class="chart-header">
          <span>课程成绩分布</span>
          <div class="chart-filters">
            <select v-model="selectedCourse" @change="updateCourseScoreDist">
              <option v-for="course in courseList" :key="course.id" :value="course.id">{{ course.name }}</option>
            </select>
            <select v-model="selectedCourseQuarter" @change="updateCourseScoreDist">
              <option v-for="q in quarterList" :key="q.value" :value="q.value">{{ q.label }}</option>
            </select>
          </div>
        </div>
        <div class="chart-body">
          <div ref="courseScoreDistChart" class="echart-box"></div>
        </div>
      </div>
      <!-- 学员成绩分布 -->
      <div class="chart-card">
        <div class="chart-header">
          <span>学员成绩分布</span>
          <div class="chart-filters">
            <select v-model="selectedStudent" @change="updateStudentScoreDist">
              <option v-for="stu in studentList" :key="stu.id" :value="stu.id">{{ stu.name }}</option>
            </select>
            <select v-model="selectedStudentQuarter" @change="updateStudentScoreDist">
              <option v-for="q in quarterList" :key="q.value" :value="q.value">{{ q.label }}</option>
            </select>
          </div>
        </div>
        <div class="chart-body">
          <div ref="studentScoreDistChart" class="echart-box"></div>
        </div>
      </div>
      <!-- 课程通过率 -->
      <div class="chart-card">
        <div class="chart-header">
          <span>课程通过率</span>
          <div class="chart-filters">
            <select v-model="selectedPassCourse" @change="updatePassRate">
              <option v-for="course in courseList" :key="course.id" :value="course.id">{{ course.name }}</option>
            </select>
            <select v-model="selectedPassQuarter" @change="updatePassRate">
              <option v-for="q in quarterList" :key="q.value" :value="q.value">{{ q.label }}</option>
            </select>
            <select v-model="selectedPassClass" @change="updatePassRate">
              <option value="">全部班级</option>
              <option v-for="cls in classList" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
            <select v-model="selectedPassStudent" @change="updatePassRate">
              <option value="">全部学员</option>
              <option v-for="stu in studentList" :key="stu.id" :value="stu.id">{{ stu.name }}</option>
            </select>
          </div>
        </div>
        <div class="chart-body">
          <div ref="passRateChart" class="echart-box"></div>
        </div>
      </div>
      <!-- 班级/班组排行榜 -->
      <div class="chart-card">
        <div class="chart-header">
          <span>班级/班组排行榜</span>
          <div class="chart-filters">
            <select v-model="rankType" @change="updateRankChart">
              <option value="class">班级</option>
              <option value="group">班组</option>
            </select>
            <select v-model="rankMetric" @change="updateRankChart">
              <option value="avgScore">平均分</option>
              <option value="passRate">通过率</option>
            </select>
            <select v-model="selectedRankQuarter" @change="updateRankChart">
              <option v-for="q in quarterList" :key="q.value" :value="q.value">{{ q.label }}</option>
            </select>
          </div>
        </div>
        <div class="chart-body">
          <div ref="rankChart" class="echart-box"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'StatisticsAnalysis',
  data() {
    const now = new Date();
    const currentYear = now.getFullYear();
    return {
      yearList: [currentYear - 2, currentYear - 1, currentYear],
      selectedYear: currentYear,
      quarterList: [
        { value: 'Q1', label: '第一季度' },
        { value: 'Q2', label: '第二季度' },
        { value: 'Q3', label: '第三季度' },
        { value: 'Q4', label: '第四季度' }
      ],
      // 课程成绩分布
      courseList: [
        { id: 'ft001', name: '装甲车辆驾驶训练' },
        { id: 'ft002', name: '战场通信训练' },
        { id: 'ft003', name: '战术协同训练' },
        { id: 'ft004', name: '战场急救技能' },
        { id: 'ft005', name: 'VR战场环境适应训练' }
      ],
      selectedCourse: 'ft001',
      selectedCourseQuarter: 'Q1',
      // 学员成绩分布
      studentList: [
        { id: 'student001', name: '张三' },
        { id: 'student002', name: '李四' },
        { id: 'student003', name: '王五' }
      ],
      selectedStudent: 'student001',
      selectedStudentQuarter: 'Q1',
      // 课程通过率
      classList: [
        { id: 'class001', name: '新兵连一班' },
        { id: 'class002', name: '新兵连二班' },
        { id: 'class003', name: '特种作战班' },
        { id: 'class004', name: '通信技术班' }
      ],
      selectedPassCourse: 'ft001',
      selectedPassQuarter: 'Q1',
      selectedPassClass: '',
      selectedPassStudent: '',
      // 排行榜
      rankType: 'class',
      rankMetric: 'avgScore',
      selectedRankQuarter: 'Q1',
      // 图表实例
      courseScoreDistChart: null,
      studentScoreDistChart: null,
      passRateChart: null,
      rankChart: null
    };
  },
  mounted() {
    this.initCharts();
  },
  methods: {
    onYearChange() {
      this.updateAllCharts();
    },
    // 初始化所有图表
    initCharts() {
      this.courseScoreDistChart = echarts.init(this.$refs.courseScoreDistChart);
      this.studentScoreDistChart = echarts.init(this.$refs.studentScoreDistChart);
      this.passRateChart = echarts.init(this.$refs.passRateChart);
      this.rankChart = echarts.init(this.$refs.rankChart);
      this.updateAllCharts();
    },
    updateAllCharts() {
      this.updateCourseScoreDist();
      this.updateStudentScoreDist();
      this.updatePassRate();
      this.updateRankChart();
    },
    // 课程成绩分布
    updateCourseScoreDist() {
      // mock数据
      const bins = ['<60', '60-70', '70-80', '80-90', '90-100'];
      const values = [5, 12, 18, 22, 8];
      this.courseScoreDistChart.setOption({
        title: { text: '' },
        tooltip: {},
        xAxis: { data: bins },
        yAxis: {},
        series: [{
          name: '人数',
          type: 'bar',
          data: values,
          itemStyle: { color: '#1890ff' }
        }]
      });
    },
    // 学员成绩分布
    updateStudentScoreDist() {
      // mock数据
      const courses = this.courseList.map(c => c.name);
      const values = [78, 85, 90, 82, 88];
      this.studentScoreDistChart.setOption({
        title: { text: '' },
        tooltip: {},
        xAxis: { data: courses },
        yAxis: {},
        series: [{
          name: '平均分',
          type: 'bar',
          data: values,
          itemStyle: { color: '#52c41a' }
        }]
      });
    },
    // 课程通过率
    updatePassRate() {
      // mock数据
      const pass = 38;
      const fail = 12;
      this.passRateChart.setOption({
        title: { text: '' },
        tooltip: { trigger: 'item' },
        series: [{
          name: '通过率',
          type: 'pie',
          radius: ['60%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: () => `通过率\n${Math.round(pass/(pass+fail)*100)}%`,
            fontSize: 22,
            color: '#1890ff',
            fontWeight: 'bold'
          },
          data: [
            { value: pass, name: '通过', itemStyle: { color: '#52c41a' } },
            { value: fail, name: '未通过', itemStyle: { color: '#ff4d4f' } }
          ]
        }]
      });
    },
    // 排行榜
    updateRankChart() {
      // mock数据
      const names = this.rankType === 'class'
        ? this.classList.map(c => c.name)
        : ['A组', 'B组', 'C组', 'D组', 'E组'];
      const values = this.rankMetric === 'avgScore'
        ? [88, 85, 82, 80, 78]
        : [0.95, 0.92, 0.90, 0.88, 0.85];
      this.rankChart.setOption({
        title: { text: '' },
        tooltip: {},
        xAxis: { data: names },
        yAxis: {
          axisLabel: this.rankMetric === 'avgScore' ? undefined : { formatter: v => (v*100).toFixed(0)+'%' }
        },
        series: [{
          name: this.rankMetric === 'avgScore' ? '平均分' : '通过率',
          type: 'bar',
          data: values,
          itemStyle: { color: '#faad14' },
          label: {
            show: true,
            position: 'top',
            formatter: v => this.rankMetric === 'avgScore' ? v.value : (v.value*100).toFixed(0)+'%'
          }
        }]
      });
    }
  }
};
</script>

<style scoped>
.statistics-analysis-container {
  padding: 20px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a1a;
}
.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}
.year-select label {
  margin-right: 8px;
  font-weight: 500;
}
.year-select select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 15px;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
}
.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 18px 18px 8px 18px;
  display: flex;
  flex-direction: column;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.chart-header span {
  font-size: 17px;
  font-weight: 600;
}
.chart-filters {
  display: flex;
  gap: 10px;
}
.chart-filters select {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
}
.chart-body {
  flex: 1;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.echart-box {
  width: 100%;
  height: 260px;
}
</style> 