/**
 * Created by virus_zhh on 2017/9/29.
 */
import VTree from './tree.vue'
import VueInputAutowidth from 'vue-input-autowidth'
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon.vue'

import VuexTree from './modules/VuexTree.js'

VTree.install = function(Vue){
  Vue.use(VueInputAutowidth)
  Vue.component(Icon.name, Icon)
  Vue.component(VTree.name, VTree)
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VTree);
}

export default {VTree, VuexTree}