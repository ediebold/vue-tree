<template>
    <li :class="classes">
      <div class="expander" @click.stop="toggleExpand">
        <template v-if="expandIcon && !isLeaf">
          <icon :name="expandIcon" :scale="1" />
        </template>
        <template v-else>
          <div class="no-icon" />
        </template>
      </div
      ><input type="checkbox" v-model="checked" :indeterminate.prop="checked=='indet'" @click.stop
      ><label class="tree-node-label" @click.stop="toggleSelect"
        ><icon :name="icon" :scale="1" :color="iconColor" class="tree-icon"
        /><div v-if="!editingText">
          {{ text }}
        </div
        ><input type="text" v-else v-model="text" v-autowidth @blur="endUpdate" @keyup.enter="endUpdate" @click.stop
      /></label
      ><div class="node-controls" v-if="defaultControls">
        <icon name="edit" :scale="1" class="tree-icon" @click.native.stop="toggleUpdate"
        /><icon name="times-circle" :scale="1" class="tree-icon" @click.native.stop="deleteSelf" />
      </div>
      <ul v-if="children && expanded">
        <TreeNode :depth="depth + 1" />
        <TreeNode :depth="depth + 1" />
      </ul>
    </li>
</template>

<script>
export default {
  name: 'TreeNode',
  data: function() {
    return {
      text: "Test",
      icon: "folder",
      iconColor: "#DD0",
      editingText: false,
      expanded: false,
      checked: false,
      selected: false,
      defaultControls: true,
    }
  },
  props: {
    depth: {type: Number, required: false, default: 0},
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
    toggleSelect: function() {
      this.selected = !this.selected;
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
    deleteSelf: function() {
      // delete from source
      // delete children
      // trigger parent update?
    }
  },
  computed: {
    classes: function() {
      return {
        "tree-node" : true,
        "selected" : this.selected,
        "expanded" : this.expanded,
        "leaf" : this.isLeaf,
      }
    },
    isLeaf: function() {
      return !this.children;
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
      return this.depth < 4;
    },
  },
}
</script>
<style>
  .tree-node > *, .tree-node-label > * {
      display: inline-block;
  }
  .tree-node.selected {
    background-color: #999;
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

  .no-icon {
    width: 0.85em;
    border-bottom: 1px solid #000;
    height: 0.5em;
    margin-left: -1px;
  }

</style>