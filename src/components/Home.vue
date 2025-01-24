<template>
  <el-container>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: 'Home',
  });
</script>