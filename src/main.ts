// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import Vue from 'vue';

Vue.config.devtools = process.env.NODE_ENV !== 'production';

import App from './App.vue';
import router from './router';

import './assets/app.css';

import ElementUI from 'element-ui';
Vue.use(ElementUI, { size: 'small' });

/* eslint-disable no-new */
new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');

(function () {
  const buildTime = process.env.VUE_APP_BUILD_TIME;
  if (buildTime) {
    console.log(
      'Build Time:',
      new Date(parseInt(buildTime, 10)).toLocaleString()
    );
    console.log('Version:', process.env.VUE_APP_VERSION);
  }
})();
