module.exports = {
  assetsDir: 'static',
  publicPath: 'wario-gifts.github.io',
  outputDir: 'docs',
  productionSourceMap: false,
  runtimeCompiler: true,
  pages: {
    index: {
      entry: 'src/main.js',
    },
  },
  devServer: {
    proxy: {
      ...GetList(['/(?:api)/'], 'http://www.baidu.com'),
    },
  },
  chainWebpack: (config) => {
    config.externals({
      jquery: 'jQuery',
      moment: 'moment',
      rxjs: 'Rx',
      lodash: '_',
      vue: 'Vue',
      'vue-router': 'VueRouter',
      vuex: 'Vuex',
      'element-ui': 'ELEMENT',
      axios: 'axios',
      xlsx: 'XLSX',
    });
  },
};

/**
 * 代理配置
 * @param {string[]} list
 * @param {string} target
 * @returns
 */
function GetList(list, target) {
  return Object.assign(
    ...list.map((t) => ({
      [t]: {
        target: target,
        changeOrigin: true,
        secure: false, //true/false, if you want to verify the SSL Certs
      },
    }))
  );
}
