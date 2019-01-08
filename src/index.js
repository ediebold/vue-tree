import VTree from './components/tree.vue'

// Textbox resizing for default tree-node text.
import VueInputAutowidth from 'vue-input-autowidth'

// VueX module.
import VuexTree from './modules/VuexTree.js'

import { VueHammer } from 'vue2-hammer' 

VTree.install = function(Vue){
  Vue.use(VueInputAutowidth)
  Vue.use(VueHammer, {domEvents: true})
  Vue.component(VTree.name, VTree)
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VTree);
}

export default {VTree, VuexTree}