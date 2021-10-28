<template>
  <div>
    <el-row>

      <button @click="LoadGame">Load Game</button>

    </el-row>
  </div>
</template>

<script lang="ts">
  import _ from "lodash";
  import { CHARACTERS, MY_DATA } from "@/data/Index";

  export default {
    data() {
      return {
        names: CHARACTERS,
        item: {
          names: [],
          gift_id: null,
        },
      };
    },
    computed: {

    },
    methods: {
      async LoadGame() {
        const pickerOpts = {
          types: [
            {
              description: 'rom',
              accept: {
                'application/octet-stream': ['.gba', '.gbc', '.gb']
              }
            },
          ],
          excludeAcceptAllOption: true,
          multiple: false
        };

        const [fileHandle] = await window['showOpenFilePicker'](pickerOpts);
        // get file contents
        const fileData = await fileHandle.getFile();
        console.log(fileData);
      },
    },
  }
</script>
