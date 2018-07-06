<template>
    <li :class="classes" draggable @dragstart.stop="startBeingDragged" @dragend.stop.prevent="endBeingDragged" @drop.stop.prevent="dropped" >
      <div class="node-drag-target" @dragenter.stop.prevent="dragEnter" @dragover.stop.prevent="dragEnter" @dragexit.prevent="dragExit" @dragleave.prevent="dragExit"
      @contextmenu.prevent="context($event, data.id)">
        <div class="expander" @click.stop="toggleExpand">
          <template v-if="expandIcon && !isLeaf">
            <icon :name="expandIcon" :scale="1" />
          </template>
          <template v-else>
            <div class="no-icon" />
          </template>
        </div
        ><input type="checkbox" :checked="data.checked" :indeterminate.prop="data.checked=='indet'" @click.prevent.stop="toggleChecked"
        ><label class="tree-node-label" @click.stop="toggleSelect"
          ><icon :name="data.icon" :scale="1" :color="data.iconColor" class="tree-icon"
          /><div v-if="!editingText">
            {{ data.text }}
          </div
          ><input type="text" v-else v-model="data.text" v-autowidth @blur="endUpdate" @keyup.enter="endUpdate" @click.stop
        /></label
        ><div v-if="dragging && currentlyDraggedOver && !beingDragged" class="dropAfterTarget" @dragenter @dragover @drop.stop.prevent="droppedAfter">
        </div>
      </div>
      <ul v-if="expanded && !isLeaf">
        <TreeNode v-for="node in children" :key="node.id" :data="node" :onCheckedChange="onCheckedChange" :onSelectedChange="onSelectedChange" :getChildren="getChildren"
        :dragging="dragging" :beginDrag="beginDrag" :endDrag="endDrag" :registerDrop="registerDrop" :registerDropAfter="registerDropAfter" :context="context" />
      </ul>
    </li>
</template>

<script>
export default {
  name: 'TreeNode',
  data: function() {
    return {
      editingText: false,
      expanded: false,
      beingDragged: false,
      currentlyDraggedOver: false,
    }
  },
  props: {
    data: {type: Object, required: true,},
    getChildren: {type: Function, required: false, default: null},
    onCheckedChange: {type: Function, required: false, default: null},
    onSelectedChange: {type: Function, required: false, default: null},
    dragging:  {type: Boolean, required: false, default: false},
    beginDrag: {type: Function, required: false, default: null},
    endDrag: {type: Function, required: false, default: null},
    registerDrop: {type: Function, required: false, default: null},
    registerDropAfter: {type: Function, required: false, default: null},
    context: {type: Function, required: false, default: null},
  },
  methods: {
    beginUpdate: function() {
      this.editingText = true;
      this.$emit('beginUpdate');
    },
    endUpdate: function() {
      this.editingText = false;
      this.$emit('endUpdate');
    },
    toggleChecked: function() {
      this.onCheckedChange(this.data.id, !this.data.checked)
    },
    toggleSelect: function() {
      this.onSelectedChange(this.data.id, !this.data.selected)
    },
    toggleUpdate: function() {
      if (!this.editingText) {
        this.beginUpdate();
      } else {
        this.endUpdate();
      }
    },
    toggleExpand: function() {
      this.expanded = !this.expanded;
    },
    startBeingDragged: function($event) {
      this.beingDragged = true;
      this.beginDrag($event, this.data);
    },
    endBeingDragged: function($event) {
      this.beingDragged = false;
      this.endDrag($event, this.data)
    },
    dropped: function($event) {
      this.currentlyDraggedOver = false;
      this.registerDrop($event, this.data)
    },
    droppedAfter: function($event) {
      this.currentlyDraggedOver = false;
      this.registerDropAfter($event, this.data)
    },
    dragEnter: function() {
      this.currentlyDraggedOver = true;
    },
    dragExit: function() {
      this.currentlyDraggedOver = false;
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
    }
  },
  watch: {
  },
  mounted: function() {
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

  .tree-icon {
    vertical-align: top;
    padding: 0 2px 0 2px;
  }
  .tree-node-label {
    cursor: default;
    padding: 0 2px 0 2px;
  }
  /* Hide the default list bubbles */
  ul.tree, .tree-node > ul {
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
    position: relative;
    height: 0.5em;
    width: 100%;
    background-color: black;
  }
</style>