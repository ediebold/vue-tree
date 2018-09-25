<template>
  <li 
  :class="classes"
  :data-node-id="nodeID">
    <template
    v-if="nodeID !== null">
      <font-awesome-icon 
      :icon="expandIcon || 'circle'" 
      fixed-width 
      :class="expandIconClasses"
      @click="toggleExpand" />
      <component 
      :is="checkboxComponent"
      ref="checkbox"
      :check="nodeData.checked" 
      @click.native.prevent.stop="toggleChecked" 
      :disabled="singleCheck && !isLeaf" />
      
      <label 
      class="tree-node-label" 
      @click="toggleSelect"
      v-hammer:press="openContext"
      @contextmenu.stop.prevent="openContext($event)">
        <component
        :is="iconComponent"
        :icon="nodeData.icon"
        :color="iconColor"
        class="tree-icon" />
        
        <div 
        v-if="!currentlyEditingText"
        class="tree-text"
        :title="nodeData.text">
          <a 
          target="_blank"
          v-if="nodeData.link" 
          :href="nodeData.link" >
            {{ nodeData.text }}
          </a>
          <template 
          v-else>
            {{ nodeData.text }}
          </template>
        </div>

        <input 
        type="text" 
        v-else 
        v-model="editedText" 
        v-autowidth="{maxWidth: '80%'}" 
        @blur="endUpdate" 
        @keyup.enter="endUpdate" 
        @click.stop />
      </label>
    </template>
    <ul 
    v-if="(expanded && !isLeaf)">
      <draggable 
      :value="nodeData.children"
      @end="registerDropUnder"
      :options="{
        group: dragGroup,
        animation: 70,
      }"
      :data-node-id="nodeData.id" >
        <TreeNode 
        v-for="childNodeID in nodeData.children" 
        :key="childNodeID" 
        :nodeID="childNodeID"
        :singleCheck="singleCheck"
        :getNodeData="getNodeData"
        :treeEventBus="treeEventBus"
        :checkboxComponent="checkboxComponent"
        :iconComponent="iconComponent"
        :editingText="editingText"
        :dragGroup="dragGroup" />
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
    singleCheck: {type: Boolean, required: false, default: false},
    getNodeData: {type: Function, required: true},
    treeEventBus: {type: Object, required: true},
    checkboxComponent: {type: Object, required: true},
    iconComponent: {type: Object, required: true},
    editingText:  {type: [Number, String], required: false},
    dragGroup: {type: String, required: true},
  },
  methods: {
    openContext: function(event) {
      if (event.srcEvent) {
        event = event.srcEvent;
      }
      this.treeEventBus.$emit('context', {id: this.nodeData.id, event: event});
    },
    beginUpdate: function() {
      this.editedText = this.nodeData.text;
    },
    endUpdate: function() {
      this.treeEventBus.$emit('endTextUpdate', {id: this.nodeData.id, newText: this.editedText});
    },
    toggleChecked: function() {
      this.treeEventBus.$emit('updateCheck', {id: this.nodeData.id, value: !this.nodeData.checked});
    },
    toggleSelect: function() {
      this.treeEventBus.$emit('updateSelect', {id: this.nodeData.id, value: !this.nodeData.selected});
    },
    toggleExpand: function() {
      this.expanded = !this.expanded;
      if (!this.expanded && !this.nodeData.selected) {
        this.treeEventBus.$emit('reselectDescendants', {id: this.nodeData.id, value: false});
      }
      // Dirty hack to get around some weird bug in Vue
      if (this.expanded) {
        this.$refs['checkbox'].$forceUpdate();
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
        "empty-expand-icon" : !this.expandIcon,
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
    expandIcon: function() {
      if (this.isLeaf) {
        return false;
      } else if (this.expanded) {
        return "minus-circle";
      } else {
        return "plus-circle";
      }
    },
    iconColor: function() {
      return this.nodeData.iconColor || '#000';
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
    display: flex
    flex-direction: row
    flex-wrap: wrap
    align-items: center

    &.selected
      background-color: #999

    .tree-node-label
      flex: 1
      min-width: 0
      display: flex
      flex-direction: row
      flex-wrap: wrap
      align-items: center
      cursor: default
      height: 1em
      padding: 0 2px 0 2px

      .tree-text, .tree-icon
        display: inline-block
    
      .tree-text
        flex: 1
        min-width: 0
        max-width: 100%
        overflow: hidden
        text-overflow: ellipsis
        height: 1em

    .expand-icon
      width: 1em

    .empty-expand-icon
      color: rgba(0,0,0,0)
    
    ul
      padding-left: 0
      flex-basis: 100%

    .tree-node>ul
      &>div>.tree-node
        padding-left: 1em
        position: relative

        &::before, &::after
          content: ""
          position: absolute
          left: 0.5em

        &::before
          border-top: 1px solid #000
          height: 100%
          top: 0.5em
          width: 0.5em

        &::after
          border-left: 1px solid #000
          height: 100%
          width: 0
          top: 0

        &:last-child::after
          height: 0.5em
        
        .empty-expand-icon
          align-self: stretch
          border-top: 1px solid #000
          border-bottom: 0
          margin-top: 0.5em
          height: 0.5em
</style>