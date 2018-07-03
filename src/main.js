import Vue from 'vue'

import VTree from './index.js'
Vue.use(VTree)

import App from './App.vue'

new Vue({
  el: '#app',
  render: h => h(App)
})
