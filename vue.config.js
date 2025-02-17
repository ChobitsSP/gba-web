process.env.VUE_APP_BUILD_TIME = Date.now().toString();
process.env.VUE_APP_VERSION = require('./package.json').version;

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
