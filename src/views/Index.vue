<template>
  <div>
    <el-row>

      <button @click="LoadGame">Load Game</button>

      <button @click="LinkHid">LinkHid</button>
    </el-row>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import _ from 'lodash';
  import { OpenRomFile } from '@/utils/FileUtils';

  export default defineComponent({
    methods: {
      async LoadGame() {
        const fileData = await OpenRomFile();
      },
      async LinkHid() {
        let devices = await navigator['hid'].getDevices();
        console.log(devices);
        devices.forEach(device => {
          console.log(`HID: ${device.productName}`);
        });
      },
    },
  });
</script>
