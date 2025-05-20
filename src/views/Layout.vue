<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <div class="logo">
          <i class="el-icon-s-platform"></i>
          <span v-show="!isCollapse">军事仿真训练系统</span>
        </div>
        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          :collapse="isCollapse"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
        >
          <!-- 系统管理 -->
          <el-submenu index="1" v-if="hasRole('admin')">
            <template slot="title">
              <i class="el-icon-setting"></i>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/roles">
              <i class="el-icon-s-tools"></i>
              <span slot="title">角色管理</span>
            </el-menu-item>
            <el-menu-item index="/users">
              <i class="el-icon-user"></i>
              <span slot="title">用户管理</span>
            </el-menu-item>
          </el-submenu>

          <!-- 班组管理 -->
          <el-submenu index="2" v-if="hasRole(['admin', 'teacher'])">
            <template slot="title">
              <i class="el-icon-s-custom"></i>
              <span>班组管理</span>
            </template>
            <el-menu-item index="/classes">
              <i class="el-icon-school"></i>
              <span slot="title">班级管理</span>
            </el-menu-item>
            <el-menu-item index="/groups">
              <i class="el-icon-s-operation"></i>
              <span slot="title">编组管理</span>
            </el-menu-item>
          </el-submenu>

          <!-- 资料管理 -->
          <el-submenu index="3">
            <template slot="title">
              <i class="el-icon-document"></i>
              <span>资料管理</span>
            </template>
            <el-menu-item index="/materials">
              <i class="el-icon-folder"></i>
              <span slot="title">教学资料</span>
            </el-menu-item>
          </el-submenu>

          <!-- 课程管理 -->
          <el-submenu index="4" v-if="hasRole(['admin', 'teacher'])">
            <template slot="title">
              <i class="el-icon-reading"></i>
              <span>课程管理</span>
            </template>
            <el-menu-item index="/course-management">
              <i class="el-icon-notebook-2"></i>
              <span slot="title">教学课程</span>
            </el-menu-item>
          </el-submenu>

          <!-- 演练管理 -->
          <el-submenu index="5">
            <template slot="title">
              <i class="el-icon-video-camera"></i>
              <span>演练管理</span>
            </template>
            <el-menu-item index="/guided-teaching">
              <i class="el-icon-reading"></i>
              <span slot="title">引导教学</span>
            </el-menu-item>
            <el-menu-item index="/free-training">
              <i class="el-icon-video-play"></i>
              <span slot="title">自由训练</span>
            </el-menu-item>
          </el-submenu>

          <!-- 考核评估 -->
          <el-submenu index="6">
            <template slot="title">
              <i class="el-icon-s-data"></i>
              <span>考核评估</span>
            </template>
            <el-menu-item index="/score-query">
              <i class="el-icon-data-line"></i>
              <span slot="title">成绩查询</span>
            </el-menu-item>
            <el-menu-item index="/teacher-review" v-if="hasRole(['admin', 'teacher'])">
              <i class="el-icon-edit-outline"></i>
              <span slot="title">教师点评</span>
            </el-menu-item>
          </el-submenu>

          <!-- 数据统计与分析 -->
          <el-submenu index="7">
            <template slot="title">
              <i class="el-icon-data-analysis"></i>
              <span>数据统计与分析</span>
            </template>
            <el-menu-item index="/analysis">
              <i class="el-icon-pie-chart"></i>
              <span slot="title">统计分析</span>
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </div>
    </el-aside>
    
    <el-container>
      <el-header height="60px">
        <div class="header-left">
          <i 
            :class="['el-icon-s-fold', 'trigger', isCollapse ? 'is-active' : '']" 
            @click="toggleSidebar"
          ></i>
          <Breadcrumb />
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-profile">
              <el-avatar :size="32" icon="el-icon-user" />
              <span class="user-name">{{ userInfo.name || '用户' }}</span>
              <i class="el-icon-caret-bottom el-icon--right"></i>
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i> 个人中心
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <i class="el-icon-switch-button"></i> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapState } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb.vue'

export default {
  name: 'Layout',
  components: {
    Breadcrumb
  },
  data() {
    return {
      isCollapse: false
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo
    }),
    isStudent() {
      return this.userInfo.role === 'student'
    }
  },
  methods: {
    hasRole(roles) {
      if (!this.userInfo.role) return false
      if (Array.isArray(roles)) {
        return roles.includes(this.userInfo.role)
      }
      return this.userInfo.role === roles
    },
    toggleSidebar() {
      this.isCollapse = !this.isCollapse
    },
    async handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/profile')
          break
        case 'logout':
          try {
            await this.$store.dispatch('user/logoutUser')
            await this.$store.dispatch('permission/initializePermissions', { role: '', userId: '' })
            this.$router.push('/login')
          } catch (error) {
            console.error('退出登录失败:', error)
            this.$message.error('退出登录失败，请重试')
          }
          break
      }
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  height: 100%;
  background-color: #001529;
}

.logo {
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  color: white;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.1);
}

.logo i {
  font-size: 24px;
  margin-right: 10px;
  flex-shrink: 0;
}

.logo span {
  white-space: nowrap;
  margin-left: 10px;
  font-size: 16px;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
  padding: 0 20px;
}

.trigger:hover {
  color: #1890ff;
}

.trigger.is-active {
  transform: rotate(180deg);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 60px;
  color: #666;
}

.user-name {
  margin: 0 8px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
}

.el-dropdown:hover .user-profile {
  background: rgba(0,0,0,.025);
}

.el-avatar {
  background: #1890ff;
}

.el-menu-item.is-active {
  background-color: #1890ff !important;
}

.el-aside {
  transition: width 0.3s;
  overflow: hidden;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style> 