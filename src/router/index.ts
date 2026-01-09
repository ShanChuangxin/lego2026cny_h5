import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home/index.vue'
import Check from '../views/Check/index.vue'
// lego cny
import Index from '../views/Index/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index
    },
    {
      path: '/index',
      name: 'index',
      component: Index
    },
    {
      path: '/check',
      name: 'check',
      component: Check
    }
  ]
})

export default router
