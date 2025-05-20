import api from '@/api'

const state = {
  token: localStorage.getItem('token') || '',
  userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true'
}

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  userInfo: state => state.userInfo,
  getUserInfo: state => state.userInfo,
  token: state => state.token,
  'getUserInfo': state => state.userInfo
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
    localStorage.setItem('token', token)
  },
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  },
  SET_AUTHENTICATED(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated
    localStorage.setItem('isAuthenticated', isAuthenticated)
  },
  CLEAR_USER_STATE(state) {
    state.token = ''
    state.userInfo = {}
    state.isAuthenticated = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
  }
}

const actions = {
  async loginUser({ commit }, loginData) {
    try {
      const response = await api.login(loginData)
      const { token, userInfo } = response.data
      
      commit('SET_TOKEN', token)
      commit('SET_USER_INFO', userInfo)
      commit('SET_AUTHENTICATED', true)
      
      return response
    } catch (error) {
      commit('CLEAR_USER_STATE')
      throw error
    }
  },
  
  async logoutUser({ commit }) {
    try {
      await api.logout()
    } finally {
      commit('CLEAR_USER_STATE')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userRole')
      localStorage.removeItem('rememberedUser')
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 