import VTree from './components/tree.vue'

// Textbox resizing for default tree-node text.
import VueInputAutowidth from 'vue-input-autowidth'


//Font-awesome icons for default icon node.
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { dom } from '@fortawesome/fontawesome-svg-core'
dom.watch() // This will kick of the initial replacement of i to svg tags and configure a MutationObserver
library.add(fas)
library.add(far)

// VueX module.
import VuexTree from './modules/VuexTree.js'

import { VueHammer } from 'vue2-hammer' 

VTree.install = function(Vue){
  Vue.use(VueInputAutowidth)
  Vue.use(VueHammer, {domEvents: true})
  Vue.component('font-awesome-icon', FontAwesomeIcon)
  Vue.component(VTree.name, VTree)
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VTree);
}

export default {VTree, VuexTree}