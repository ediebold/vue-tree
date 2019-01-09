<template>
  <li 
  :class="classes"
  :data-node-id="nodeID">
    <div
    class="main-node-container"
    v-if="nodeID !== null">
      <div class="expand-click" 
      @click.prevent.stop="toggleExpand">
        <slot name="node_expand_icon" :expandStatus="expandStatus">
          <div 
          :class="expandIconClasses">
            {{expandStatus == null ? '' : expandStatus == true ? '−' : '+'}}
          </div>
        </slot>
      </div>
      <div class="checkbox-click" 
      @click.prevent.stop="toggleChecked">
        <slot name="node_checkbox" :nodeData="nodeData">
          <input 
            type="checkbox"
            class="tree-basic-checkbox"
            :checked="nodeData.checked"
            :indeterminate.prop="nodeData.checked =='indet'" />
        </slot>
      </div>

      <div class="tree-node-label-container">
        <label 
        class="tree-node-label" 
        :style="{ color: nodeData.labelColor || 'auto', }"
        v-hammer:tap="toggleSelect"
        v-hammer:press="openContext"
        :hammerOptions.camel.prop="{
          press: {
            time: 1250,
            threshold: 5,
          }
        }"
        @contextmenu.stop.prevent="openContext($event)">
          <div
          class="tree-icon"
          v-if="nodeData.icon">
            <slot name="node_icon" :nodeData="nodeData" />
          </div>
          
          <div 
          v-if="!currentlyEditingText"
          class="tree-text"
          :title="nodeData.text">
            <a 
            target="_blank"
            class="node-text-clickable"
            v-if="nodeData.link" 
            :href="nodeData.link" >
              <slot name="node_text" :nodeData="nodeData">
                {{ nodeData.text }}
              </slot>
            </a>
            <template 
            v-else>
              <slot name="node_text" :nodeData="nodeData">
                {{ nodeData.text }}
              </slot>
            </template>
          </div>

          <input 
          type="text" 
          class="node-text-input node-text-clickable"
          ref="textinput"
          v-else 
          v-model="editedText" 
          v-autowidth="{maxWidth: '80%'}" 
          @blur="endUpdate" 
          @keyup.enter="endUpdate" />
        </label>
      </div>
    </div>
    <ul 
    v-if="(expanded && !isLeaf)">
      <draggable 
      :value="nodeData.children"
      @end="registerDropUnder"
      :options="{
        group: dragGroup,
        handle: '.tree-node-label',
        animation: 70,
        fallbackTolerance: 3,
      }"
      :data-node-id="nodeData.id" >
        <TreeNode 
        v-for="childNodeID in nodeData.children" 
        :key="childNodeID" 
        :nodeID="childNodeID"
        :getNodeData="getNodeData"
        :treeEventBus="treeEventBus"
        :editingText="editingText"
        :dragGroup="dragGroup">
          <slot v-for="slot in Object.keys($slots)" :name="slot" :slot="slot"/>
          <template v-for="slot in Object.keys($scopedSlots)" :slot="slot" slot-scope="scope">
            <slot :name="slot" v-bind="scope"/>
          </template>
        </TreeNode>
      </draggable>
    </ul>
  </li>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'TreeNode',
  data: function() {
    return {
      editedText: "",
      expanded: this.nodeID === null,
    }
  },
  props: {
    nodeID: {type: String, required: false, default: null},
    getNodeData: {type: Function, required: true},
    treeEventBus: {type: Object, required: true},
    editingText:  {type: [Number, String], required: false},
    dragGroup: {type: String, required: true},
  },
  methods: {
    openContext: function(event) {
      if (event.srcEvent) {
        event = event.srcEvent;
      }
      this.treeEventBus.$emit('context', {id: this.nodeData, event: event});
    },
    beginUpdate: function() {
      this.editedText = this.nodeData.text;
      this.$nextTick(function() {
        if (this.$refs.textinput)
        this.$refs.textinput.focus();
      })
    },
    endUpdate: function() {
      this.treeEventBus.$emit('endTextUpdate', {id: this.nodeData.id, newText: this.editedText});
    },
    toggleChecked: function() {
      this.treeEventBus.$emit('updateCheck', {id: this.nodeData.id, value: !this.nodeData.checked});
    },
    toggleSelect: function(e) {
      console.log(e)
      if (e.target.classList.contains("node-text-clickable")) return;
      this.treeEventBus.$emit('updateSelect', {id: this.nodeData.id, value: !this.nodeData.selected});
    },
    toggleExpand: function() {
      this.expanded = !this.expanded;
      if (!this.expanded && !this.nodeData.selected) {
        this.treeEventBus.$emit('reselectDescendants', {id: this.nodeData.id, value: false});
      }
    },
    registerDropUnder: function(event) {
      this.treeEventBus.$emit('registerDropUnder', {id: this.nodeData.id, event: event});
    },
  },
  computed: {
    nodeData: function() {
      return this.getNodeData(this.nodeID);
    },
    classes: function() {
      return {
        "tree-node" : true,
        "selected" : this.nodeData == null ? false : this.nodeData.selected,
        "expanded" : this.expanded,
        "leaf" : this.isLeaf,
        "root" : this.isRoot,
      }
    },
    expandIconClasses: function() {
      return {
        "tree-icon" : true,
        "expand-icon" : true,
        "empty-expand-icon" : this.expandStatus == null,
      }
    },
    isRoot: function() {
      if (this.nodeData == null) return false;
      return this.nodeData.parent == null;
    },
    isLeaf: function() {
      if (this.nodeData == null) return false;
      return !this.nodeData.children.length > 0;
    },
    expandStatus: function() {
      if (this.isLeaf) {
        return null;
      } else if (this.expanded) {
        return true;
      } else {
        return false;
      }
    },
    currentlyEditingText: function() {
      if (this.nodeData == null) return false;
      return this.editingText == this.nodeData.id;
    }
  },
  watch: {
    currentlyEditingText: function(newValue, oldValue) {
      if (newValue) {
        this.beginUpdate();
      }
    },
  },
  components: {
    draggable,
  },
}
</script>
<style lang="stylus">
  .tree-node

    .main-node-container
      display: flex
      flex-direction: row
      flex-wrap: wrap
      align-items: center
      max-width: 100%
      height: 1.5em

    &.selected
      background-color: #999

    .tree-node-label-container
      flex: 1
      min-width: 0
      display: flex
      flex-direction: row
      flex-wrap: wrap
      align-items: center
      cursor: default
      height: 100%
      padding: 0 2px 0 2px

      .tree-node-label
        height: 100%
        max-width: 100%

        .tree-text, .tree-icon, .tree-icon > *
          display: inline-block
      
        .tree-text
          min-width: 0
          max-width: 100%
          overflow: hidden
          text-overflow: ellipsis
          height: 1em
          position: relative
          top: 50%
          transform: translateY(-50%)

        .node-text-input
          height: 100%

    .expand-click
      height: 100%
      display: flex
      margin-right: 0.25em

    .expand-icon
      box-sizing: border-box
      width: 1em
      height: 1em
      line-height: 0.8em
      text-align: center
      align-self: center
      font-weight: bolder
      color: #eee
      margin: 0
      border: 1px solid #444
      border-radius: 1em
      background-color: #444

    .empty-expand-icon
      color: rgba(0,0,0,0)
      background-color: rgba(0,0,0,0)
      border: 0

    
    ul
      padding-left: 0
      flex-basis: 100%
      max-width: 100%

    .tree-node>ul
      &>div>.tree-node
        padding-left: 1em
        position: relative

        &::before, &::after
          content: ""
          box-sizing: border-box
          position: absolute
          left: 0.5em

        &::before
          border-top: 1px solid #000
          height: 100%
          top: 0.75em
          width: 0.5em

        &::after
          border-left: 1px solid #000
          height: 100%
          width: 0
          top: -0.25em

        &:last-child::after
          height: 1em
        
        .empty-expand-icon
          height: 50%
          align-self: flex-end;
          border-radius: 0
          border-top: 1px solid #000
</style>