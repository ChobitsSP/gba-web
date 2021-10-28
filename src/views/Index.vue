<template>
  <div>
    <el-form :model="item"
             size="mini">
      <el-form-item label="礼物">
        <el-select v-model.number="item.gift_id"
                   filterable
                   clearable
                   placeholder="请选择">
          <el-option v-for="gift in gifts"
                     :key="gift.id"
                     :label="gift.name"
                     :value="gift.id">
            <span style="float: left">{{ gift.id }}</span>
            <span
                  style="float: right; color: #8492a6; font-size: 13px">{{ gift.name }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="人物">
        <el-checkbox-group v-model="item.names"
                           @change="item.gift_id = null">
          <el-checkbox-button v-for="name in names"
                              :label="name"
                              :key="name">{{ name }}</el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <el-row>
      <el-table :data="rows"
                border
                size="mini"
                style="width: 100%"
                max-height="600">
        <el-table-column type="expand">
          <template slot-scope="props">
            <span>{{ props.row.names }}</span>
          </template>
        </el-table-column>
        <el-table-column label="id"
                         prop="id"
                         sortable></el-table-column>
        <el-table-column label="name"
                         prop="name"
                         sortable></el-table-column>
        <el-table-column prop="star"
                         label="star"
                         sortable
                         column-key="star"
                         :filters="[{text: '1', value: 1}, {text: '2', value: 2}, {text: '3', value: 3}, {text: '4', value: 4}, {text: '5', value: 5}]"
                         :filter-method="filterHandler">
        </el-table-column>
      </el-table>
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
      gifts() {
        const filter = this.item;
        return _.chain(MY_DATA)
          .filter(t => filter.names.length === 0 || _.intersection(t.names.split(','), filter.names).length > 0)
          .value();
      },
      rows() {
        const filter = this.item;
        const rows = _.chain(this.gifts)
          .filter(t => !filter.gift_id || filter.gift_id === t.id)
          .value();
        return rows;
      },
    },
    methods: {
      filterHandler(value, row, column) {
        const property = column['property'];
        return row[property] === value;
      },
    },
  }
</script>
