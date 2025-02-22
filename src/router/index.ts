﻿import Vue from 'vue';
import Router from 'vue-router';
Vue.use(Router);

const routes = [
  {
    path: '/',
    component: () => import('../components/Home.vue'),
    children: [
      {
        path: '',
        name: 'index',
        component: () => import('../views/Index.vue'),
        meta: {},
      },
    ],
  },
];

const router = new Router({
  mode: 'history',
  routes,
  scrollBehavior(to, from, savedPosition) {
    // return 期望滚动到哪个的位置
    return { x: 0, y: 0 };
  },
});

router.beforeEach((route, redirect, next) => {
  document.title = route.meta.title || document.title;
  next();
});

export default router;
