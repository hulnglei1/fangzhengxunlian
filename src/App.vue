<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f0f2f5;
}

* {
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  cursor: pointer;
}

input, select, textarea, button {
  font-family: inherit;
}

h1, h2, h3, h4, h5, h6, p {
  margin-top: 0;
}

.required {
  color: #ff4d4f;
  margin-left: 4px;
}

.profile-menu-item {
  margin-top: auto !important;
}
</style> 