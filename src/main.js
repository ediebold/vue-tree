import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import VuexTree from './index.js'
Vue.use(VuexTree.VTree)

const store = new Vuex.Store({ modules: {tree2: VuexTree.VuexTree}})

import App from './App.vue'

new Vue({
  el: '#app',
  render: h => h(App),
  store: store,
})
