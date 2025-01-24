module.exports = {
  assetsDir: 'static',
  productionSourceMap: false,
  runtimeCompiler: true,
  pages: {
    index: {
      entry: 'src/main.ts',
    },
  },
  chainWebpack: (config) => {
    config.externals({
      moment: 'moment',
      rxjs: 'Rx',
      lodash: '_',
      vue: 'Vue',
      'vue-router': 'VueRouter',
      'element-ui': 'ELEMENT',
    });
  },
};