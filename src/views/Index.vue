<template>
  <div>
    <el-button type="primary"
               @click="LoadGame">Load Game</el-button>
    <el-button type="primary"
               @click="LinkHid">LinkHid</el-button>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import _ from 'lodash';
  import { OpenRomFile } from '@/utils/FileUtils';

  export default defineComponent({
    setup() {
      return {
        async LoadGame() {
          const fileData = await OpenRomFile();
        },
        async LinkHid() {
          // https://developer.mozilla.org/zh-CN/docs/Web/API/WebHID_API
          const device = await navigator['hid'].requestDevice({ filters: [] });
          console.log(device);
          let devices = await navigator['hid'].getDevices();
          console.log(devices);
          devices.forEach(device => {
            console.log(`HID: ${device.productName}`);
          });
        },
      };
    },
  });
</script>
