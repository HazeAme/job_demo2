<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(29, 157, 142, 0.08), transparent 28%),
    radial-gradient(circle at right 20%, rgba(198, 156, 74, 0.08), transparent 22%),
    linear-gradient(180deg, #f8f7f2 0%, #eef5f2 46%, #f5f4ef 100%);
  min-height: 100vh;
}
</style>
