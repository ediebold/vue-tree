import Vue from 'vue'

import Vuex from 'vuex'

Vue.use(Vuex)

import VuexTree from './modules/VuexTree.js'

const store = new Vuex.Store({ modules: {tree2: VuexTree}})

import VTree from './index.js'
Vue.use(VTree)

import App from './App.vue'

new Vue({
  el: '#app',
  render: h => h(App),
  store: store,
})
