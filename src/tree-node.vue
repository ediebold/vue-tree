<template>
    <li :class="classes" draggable @dragstart.stop="startBeingDragged" @dragend.stop.prevent="endBeingDragged" @drop.stop.prevent="dropped" >
      <div class="node-drag-target" @dragenter.stop.prevent="dragEnter" @dragover.stop.prevent="dragEnter" @dragexit.prevent="dragExit" @dragleave.prevent="dragExit" 
      @contextmenu.stop.prevent="context($event, data.id)">
        <div class="expander" @click.stop="toggleExpand">
          <template v-if="expandIcon && !isLeaf">
            <font-awesome-icon :icon="expandIcon" />
          </template>
          <template v-else>
            <div class="no-icon" />
          </template>
        </div
        ><input type="checkbox" :checked="data.checked" :indeterminate.prop="data.checked=='indet'" @click.prevent.stop="toggleChecked" :disabled="singleCheck && !isLeaf"
        ><label class="tree-node-label" @click.stop="toggleSelect"
          ><font-awesome-icon v-if="!useImageIcons && data.icon.length > 0" :icon="data.icon" :style="{color: data.iconColor}" class="tree-icon"
          /><img class="tree-icon" v-else-if="useImageIcons" :src="data.icon"
          /><div :title="data.text" class="tree-text" v-if="!(editing == data.id)">
            {{ data.text }}
          </div
          ><input type="text" v-else v-model="editedText" v-autowidth="{maxWidth: '80%'}" @blur="endUpdate" @keyup.enter="endUpdate" @click.stop
        /></label>
      <ul v-if="expanded && !isLeaf">
        <TreeNode v-for="node in children" :key="node.id" :data="node" :updateCheck="updateCheck" :updateSelect="updateSelect" :getChildren="getChildren" :singleCheck="singleCheck"
        :dragging="dragging" :editing="editing" :editingIcon="editingIcon" :reselectDescendants="reselectDescendants" :endEditText="endEditText" :beginDrag="beginDrag" :endDrag="endDrag" :registerDrop="registerDrop" :registerDropAfter="registerDropAfter" :context="context"
        :useImageIcons="useImageIcons" />
      </ul>
        <div v-if="dragging && currentlyDraggedOver && !beingDragged" :class="{dropAfterTarget: true, dropAfterTargetHover: currentlyDraggedOverNext}" 
        @dragenter.prevent="showAsNext" @dragover.prevent="showAsNext" @dragexit.prevent="stopShowAsNext" @dragleave.prevent="stopShowAsNext" @drop.stop.prevent="droppedAfter">
          <template v-if="currentlyDraggedOverNext">
            <div class="no-icon" style="display: inline-block"
            /><input type="checkbox" :checked="dragging.checked" :indeterminate.prop="dragging.checked=='indet'"
            /><label class="tree-node-label"
              ><icon v-if="dragging.icon" :name="dragging.icon" :scale="1" :color="dragging.iconColor" class="tree-icon"
              />{{ dragging.text }}
            </label>
          </template>
        </div>
      </div>
    </li>
</template>

<script>
export default {
  name: 'TreeNode',
  data: function() {
    return {
      editedText: "",
      expanded: false,
      beingDragged: false,
      currentlyDraggedOver: false,
      currentlyDraggedOverNext: false,
    }
  },
  props: {
    data: {type: Object, required: true,},
    singleCheck: {type: Boolean, required: false, default: null},
    getChildren: {type: Function, required: false, default: null},
    updateCheck: {type: Function, required: false, default: null},
    updateSelect: {type: Function, required: false, default: null},
    dragging:  {type: Object, required: false},
    editing:  {type: [Number, String], required: false},
    editingIcon: {type: [Number, String], required: false},
    useImageIcons: {type: Boolean, required: false},
    endEditText: {type: Function, required: false, default: null},
    reselectDescendants: {type: Function, required: false, default: null},
    beginDrag: {type: Function, required: false, default: null},
    endDrag: {type: Function, required: false, default: null},
    registerDrop: {type: Function, required: false, default: null},
    registerDropAfter: {type: Function, required: false, default: null},
    context: {type: Function, required: false, default: null},
  },
  methods: {
    beginUpdate: function() {
      this.editedText = this.data.text;
    },
    endUpdate: function() {
      this.endEditText(this.data.id, this.editedText);
      //this.$emit('endUpdate');
    },
    toggleChecked: function() {
      this.updateCheck(this.data.id, !this.data.checked)
    },
    toggleSelect: function() {
      this.updateSelect(this.data.id, !this.data.selected)
    },
    toggleExpand: function() {
      this.expanded = !this.expanded;
      if (!this.expanded && !this.data.selected) {
        this.reselectDescendants(this.data.id, false);
      }
    },
    startBeingDragged: function($event) {
      this.beingDragged = true;
      if (this.expanded) {
        this.toggleExpand();
      }
      this.beginDrag($event, this.data);
    },
    endBeingDragged: function($event) {
      this.beingDragged = false;
      this.endDrag($event, this.data)
    },
    dropped: function($event) {
      this.currentlyDraggedOver = false;
      this.currentlyDraggedOverNext = false;
      this.registerDrop($event, this.data)
    },
    droppedAfter: function($event) {
      this.currentlyDraggedOver = false;
      this.currentlyDraggedOverNext = false;
      this.registerDropAfter($event, this.data)
    },
    dragEnter: function() {
      this.currentlyDraggedOver = true;
    },
    dragExit: function() {
      this.currentlyDraggedOver = false;
    },
    showAsNext: function() {
      this.currentlyDraggedOverNext = true;
    },
    stopShowAsNext: function() {
      this.currentlyDraggedOverNext = false;
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
        "highlighted" : this.currentlyDraggedOver,
        "dragged" : this.beingDragged,
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
    children: function() {
      return this.getChildren(this.data.id);
    },
  },
  watch: {
    editing: function(newValue, oldvalue) {
      if (newValue) {
        this.beginUpdate();
      }
    },
  },
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
</style>