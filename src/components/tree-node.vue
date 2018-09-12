<template>
  <div 
  :class="classes"
  :data-node-id="data.id">
    <template
    v-if="data.id !== null">
      <font-awesome-icon 
      :icon="expandIcon || 'circle'" 
      fixed-width 
      class="expand-icon"
      :style="expandIconColor"
      @click="toggleExpand"
      :id="'tree-icon-' + data.id"
      @dragover.stop.prevent="visualiseChild"
      @dragleave.stop.prevent="visualiseChild3"
      @dragexit.stop.prevent="visualiseChild3" />

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
          v-if="data.link" 
          :href="data.link" >
            {{ data.text }}
          </a>
          <template 
          v-else>
            {{ data.text }} {{ data.id}}
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
    v-if="(expanded && !isLeaf) || (isLeaf && fakeExpand)">
      <draggable 
      :value="children"
      @end="registerDropUnder"
      :move="visualiseChild2"
      :options="{
        group: dragGroup,
        animation: 250,
      }"
      :data-node-id="data.id"
      :style="{'min-height': '1em', 'background-color': 'rgba(255,0,0,0.2)'}" >
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
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'TreeNode',
  data: function() {
    return {
      editedText: "",
      expanded: this.data.id === null,
      dragMoveHoverStartTime: 0,
      dragMoveHoverIndex: -1,
      dragMoveHoverTime: 0,
      dragMoveExpandStartTime: 0,
      dragMoveExpandIndex: -1,
      dragMoveExpandTime: 250,
      fakeExpand: false,
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
      this.treeEventBus.$emit("DragEnd");
      this.treeEventBus.$emit('registerDropUnder', {id: this.data.id, event: event});
    },
    visualiseChild: function(event) {
      //if (!event.srcElement.id.startsWith("tree-icon-")) return;
      if (event.srcElement.id == "tree-icon-" + this.data.id) return;
      console.log("event", event.srcElement.id, "tree-icon-" + this.data.id, event.relatedTarget)
      if (event.srcElement.id == this.dragMoveExpandIndex) {
        if (Date.now() - this.dragMoveExpandStartTime < this.dragMoveExpandTime) {
          //Hovering, but long enough. Do nothing.
          return false;
        } else {
          // Expand!
          this.dragMoveExpandIndex = -1;
          this.dragMoveExpandStartTime = 0;
          // Expand if not expanded
          if (!this.isLeaf && !this.expanded) {
            this.toggleExpand();
          // Fake expand if leaf
          } else if (this.isLeaf) {
            this.fakeExpand = true;
          }
        }
      } else {
        // Reset timer
        this.dragMoveExpandStartTime = Date.now();
        this.dragMoveExpandIndex = event.srcElement.id;
        return false;
      }
      return false;
    },
    visualiseChild3: function(event) {
      //this.fakeExpand = false;
    },
    visualiseChild2: function(event) {
      if (event.relatedContext.index == this.dragMoveHoverIndex) {
        if (Date.now() - this.dragMoveHoverStartTime < this.dragMoveHoverTime) {
          return false;
        } else {
          this.dragMoveHoverIndex = -1;
          this.dragMoveHoverStartTime = 0;
          return true;
        }
      } else {
        this.dragMoveHoverStartTime = Date.now();
        this.dragMoveHoverIndex = event.relatedContext.index;
        return false;
      }
      return false;
    },
    closeFakeExpand: function() {
      this.fakeExpand = false;
    }
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
    expandIconColor: function() {
      if (!this.expandIcon) {
        return { color: 'rgba(1,1,1,1)' };
      } else {
        return {};
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
  created: function() {
    this.treeEventBus.$on("DragEnd", this.closeFakeExpand);
  }
}
</script>
<style>
  .tree-node > *, .tree-node-label > *, .node-drag-target > * {
    display: inline-block;
  }
  .tree-node.selected > .node-drag-target {
    background-color: #999;
  }

  .tree-node.highlighted > .node-drag-target {
    background-color: #CCC;
  }

  .tree-node.dragged > .node-drag-target {
    /*display: none;*/
    background-color: #AAA;
  }

  .node-drag-target {
    width: 100%;
  }

  .expand-icon {
    width: 1em;
  }

  .tree-icon {
    vertical-align: top;
    padding: 0 2px 0 2px;
    width: 1em;
  }
  .tree-node-label {
    cursor: default;
    padding: 0 2px 0 2px;
  }
  /* Hide the default list bubbles */
  ul.tree, .tree-node ul {
    list-style: none;
    padding-left: 0;
  }
  .tree-node ul > div > .tree-node {
    padding-left: 1em;
  }
  /* Show children on new line */
  .tree ul { 
    display: block; 
  }
  .tree input.expandedCheckbox {
    position: absolute;
    margin: 0.2em 0 0 -1em;
    visibility: hidden;
  }
  .tree div.expander {
    position: relative;
    float: left;
    text-align: center;
    padding-top: 2px;
    line-height: .8em;
  }

  ul.tree li {
    position: relative;
  }

  .tree-node li::before, .tree-node li::after {
      content: "";
      position: absolute;
      left: -0.55em;
  }

  .tree-node li::before {
      border-top: 1px solid #000;
      top: 0.6em;
      width: 0.75em;
      height: 0;
  }

  .tree-node li::after {
      border-left: 1px solid #000;
      height: 100%;
      width: 0;
      top: 0;
  }

  .tree-node ul > li:last-child::after {
      height: 0.6em;
  }

  .tree-node.leaf.root .no-icon {
      border-bottom: 0;
  }

  .no-icon {
    width: 1em;
    border-bottom: 1px solid #000;
    height: 0.5em;
    margin-left: 0px;
  }

  .dropAfterTarget {
    display: block;
    bottom: 0;
    left: 0;
    height: 0.4em;
    width: 100%;
    background-color: #999;
  }

  .dropAfterTargetHover {
    height: 1em;
    background-color: #999;
  }

  .node-drag-target {
    overflow: hidden;
    vertical-align: bottom;
  }

  .tree-node-label {
    width: 80%;
  }

  .tree-text {
    width: 80%;
    overflow: hidden;
    vertical-align: bottom;
    word-wrap: nowrap;
    text-overflow: ellipsis;
  }

  .tree-image {
    vertical-align: bottom;
    width: 2em;
    height: 2em;
  }
</style>