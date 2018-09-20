<template>
  <li 
  :class="classes"
  :data-node-id="data.id">
    <template
    v-if="data.id !== null">
      <font-awesome-icon 
      :icon="expandIcon || 'circle'" 
      fixed-width 
      :class="expandIconClasses"
      @click="toggleExpand" />

      <component 
      :is="checkboxComponent"
      :check="data.checked" 
      @click.prevent.stop="toggleChecked" 
      :disabled="singleCheck && !isLeaf" />
      
      <label 
      class="tree-node-label" 
      @click="toggleSelect"
      v-hammer:press="openContext"
      @contextmenu.stop.prevent="openContext($event)">
        <component
        :is="iconComponent"
        :icon="data.icon"
        :color="iconColor"
        class="tree-icon" />
        
        <div 
        v-if="!currentlyEditingText"
        class="tree-text"
        :title="data.text">
          <a 
          target="_blank"
          v-if="data.link" 
          :href="data.link" >
            {{ data.text }}
          </a>
          <template 
          v-else>
            {{ data.text }}
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
      :value="children"
      @end="registerDropUnder"
      :options="{
        group: dragGroup,
        animation: 70,
      }"
      :data-node-id="data.id" >
        <TreeNode 
        v-for="node in children" 
        :key="node.id" 
        :data="node"
        :singleCheck="singleCheck"
        :getChildren="getChildren"
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
      expanded: this.data.id === null,
    }
  },
  props: {
    data: {type: Object, required: true},
    singleCheck: {type: Boolean, required: false, default: false},
    getChildren: {type: Function, required: true},
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
      this.treeEventBus.$emit('context', {id: this.data.id, event: event});
    },
    beginUpdate: function() {
      this.editedText = this.data.text;
    },
    endUpdate: function() {
      this.treeEventBus.$emit('endTextUpdate', {id: this.data.id, newText: this.editedText});
    },
    toggleChecked: function() {
      this.treeEventBus.$emit('updateCheck', {id: this.data.id, value: !this.data.checked});
    },
    toggleSelect: function() {
      this.treeEventBus.$emit('updateSelect', {id: this.data.id, value: !this.data.selected});
    },
    toggleExpand: function() {
      this.expanded = !this.expanded;
      if (!this.expanded && !this.data.selected) {
        this.treeEventBus.$emit('reselectDescendants', {id: this.data.id, value: false});
      }
    },
    registerDropUnder: function(event) {
      this.treeEventBus.$emit('registerDropUnder', {id: this.data.id, event: event});
    },
  },
  computed: {
    classes: function() {
      return {
        "tree-node" : true,
        "selected" : this.data.selected,
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
      return this.data.parent == null;
    },
    isLeaf: function() {
      return !this.children.length > 0;
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
      return this.data.iconColor || '#000';
    },
    children: function() {
      return this.getChildren(this.data.id);
    },
    currentlyEditingText: function() {
      return this.editingText == this.data.id;
    }
  },
  watch: {
    currentlyEditingText: function(newValue, oldvalue) {
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
          top: 0.5em
          width: 0.5em
          height: 0

        &::after
          border-left: 1px solid #000
          height: 100%
          width: 0
          top: 0

        &:last-child::after
          height: 0.5em
        
        .empty-expand-icon
          border-top: 1px solid #000
          margin-top: 0.5em
          height: 0.5em
</style>