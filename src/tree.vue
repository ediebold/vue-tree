<template>
    <div>
        <vue-context ref="vuetreemenu">
            <ul class="options" slot-scope="child">
                <template v-if="defaultControls">
                    <li @click="beginAddChildNode(child.data)">Add Child</li>
                    <li @click="editNodeText(child.data)">Edit Text</li>
                    <!-- <li @click="editNodeIcon(child.data)">Edit Icon</li> -->
                    <li @click="deleteNode(child.data)">Delete</li>
                    <li v-for="control in treeEvents.contextOptions" @click="control.func(child.data)">{{control.label}}</li>
                </template>

            </ul>
        </vue-context>
        <ul class="tree"> 
            <TreeNode v-for="node in rootNodes" :key="node.id" :data="node" :onCheckedChange="checked" :onSelectedChange="selected" :getChildren="getChildren"
            :dragging="draggingNodeID != null" :beginDrag="beginDrag" :endDrag="endDrag" :registerDrop="registerDrop" :registerDropAfter="registerDropAfter" :context="openContextMenu"  />
        </ul>
    </div>
</template>
<script>
    import TreeNode from './tree-node.vue'
    import {VueContext} from 'vue-context'

    export default {
        name: 'VTree',
        data: function() {
            return {
                nodes: [
                    {id: 1, text: "asd", checked: true, selected: false, parent: null, previousSibling: null},
                    {id: 2, text: "sad", checked: false, selected: false, parent: 1, previousSibling: null},
                    {id: 3, text: "dsa", checked: true, selected: false, parent: 1, previousSibling: 5},
                    {id: 4, text: "child", checked: false, selected: false, parent: 2, previousSibling: null},
                    {id: 5, text: "before", checked: false, selected: false, parent: 1, previousSibling: 2},
                    {id: 6, text: "extra", checked: false, selected: false, parent: null, previousSibling: 1},
                    {id: 7, text: "extra2", checked: false, selected: false, parent: null, previousSibling: 6},
                ],
                draggingNodeID: null,
                defaultControls: true,
                treeEvents: {
                    checked: function(id, newValue){console.log("test2", id, newValue)},
                    selected: function(id, newValue){console.log("test2", id, newValue)},
                    contextOptions: [
                        {label: "test", func: function(id){console.log("test", id)}},
                        {label: "test2", func: function(id){console.log("test2", id)}},
                    ],
                }
            }
        },
        methods: {
            checked: function(id, newValue) {
                this.nodes.find(node => node.id == id).checked = newValue;
                this.treeEvents.checked(id, newValue)
            },
            selected: function(id, newValue) {
                this.nodes.find(node => node.id == id).selected = newValue;
                this.treeEvents.selected(id, newValue)
            },
            getChildren: function(id) {
                if (typeof id === 'undefined') {
                    id = null;
                }
                let unsortedChildren = this.nodes.filter(node => node.parent == id);
                if (unsortedChildren.length <= 1) return unsortedChildren;
                let sortedChildren = [];
                let nextID = null;
                while (unsortedChildren.length > 0) {
                    let next = unsortedChildren.findIndex(node => node.previousSibling == nextID);
                    nextID = unsortedChildren[next].id;
                    sortedChildren.push(unsortedChildren[next])
                    unsortedChildren.splice(next, 1);
                }
                return sortedChildren;
            },
            beginDrag: function(e, nodeData) {
                this.draggingNodeID = nodeData.id;
            },
            endDrag: function(e, nodeData) {
                this.draggingNodeID = null;
            },
            registerDrop: function(e, nodeData) {
                if (this.draggingNodeID == nodeData.id) return;
                let draggedNode = this.nodes.find(node => node.id == this.draggingNodeID);
                if (draggedNode.parent == nodeData.id) return;
                let oldSiblings = this.getChildren(draggedNode.parent);
                let oldPrevious = oldSiblings.find(node => node.previousSibling == this.draggingNodeID)
                if (oldPrevious != null) {
                    oldPrevious.previousSibling = draggedNode.previousSibling;
                }
                let newSiblings = this.getChildren(nodeData.id);
                if (newSiblings.length == 0) {
                    draggedNode.previousSibling = null;
                } else {
                    draggedNode.previousSibling = newSiblings[newSiblings.length - 1].id
                }
                draggedNode.parent = nodeData.id;
            },
            registerDropAfter: function(e, nodeData) {
                if (this.draggingNodeID == nodeData.id) return;
                let draggedNode = this.nodes.find(node => node.id == this.draggingNodeID);
                if (draggedNode.previousSibling == nodeData.id) return;
                let oldSiblings = this.getChildren(draggedNode.parent);
                let oldPrevious = oldSiblings.find(node => node.previousSibling == this.draggingNodeID)
                if (oldPrevious != null) {
                    oldPrevious.previousSibling = draggedNode.previousSibling;
                }
                // set whoever had target as previous to use me.
                let newSiblings;
                if (nodeData.parent == draggedNode.parent) {
                    newSiblings = oldSiblings;
                } else {
                    newSiblings = this.getChildren(nodeData.parent);
                }
                if (newSiblings.length > 0) {
                    let nowAfterMe = newSiblings.find(node => node.previousSibling == nodeData.id)
                    if (nowAfterMe != null) {
                        nowAfterMe.previousSibling = draggedNode.id;
                    }
                }
                // set my previous to target
                draggedNode.previousSibling = nodeData.id;
                // set parent to target's parent
                draggedNode.parent = nodeData.parent;
            },
            openContextMenu: function(e, id) {
                this.$refs.vuetreemenu.open(e, id);
            },
            beginAddChildNode: function(id) {
                console.log(id)
            },
            editNodeText: function(id) {
                console.log(id)
            },
            // editNodeIcon: function(id) {
            //     console.log(id)
            // },
            deleteNode: function(id) {
                console.log(id)
            },
        },
        computed: {
            rootNodes: function() {
                return this.getChildren(null);
            }
        },
        components: {
            TreeNode,
            VueContext,
        }
    }
</script>

<style>
    .v-context {
        width: 100px !important;
    }

    .v-context ul, .v-context li {
        padding: 0 !important;
    }

    .v-context ul {
        font-size: inherit !important;
        font-weight: normal !important;
    }

    .v-context li {
        border-bottom: 1px #CCC solid !important;
    }
</style>
