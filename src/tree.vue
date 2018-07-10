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
            <TreeNode v-for="node in rootNodes" :key="node.id" :data="node" :updateCheck="updateCheck" :updateSelect="updateSelect" :onCheckChange="onCheckChange" :onSelectChange="onSelectChange" :getChildren="getChildren"
            :dragging="dragging" :editing="editing" :reselectDescendants="reselectDescendants" :endEditText="endEditText" :beginDrag="beginDrag" :endDrag="endDrag" :registerDrop="registerDrop" :registerDropAfter="registerDropAfter" :context="openContextMenu"  />
        </ul>
        <button class="newNodeButton" @click="makeRootNode">New Root Node</button>
    </div>
</template>
<script>
    import TreeNode from './tree-node.vue'
    import {VueContext} from 'vue-context'

    export default {
        name: 'VTree',
        data: function() {
            return {
                draggingNodeID: null,
                editing: null,
                defaultControls: true,
            }
        },
        props: {
            treeEvents: {type: Object, required: false, default: {}},
            separateSelection: {type: Boolean, required: false, default: true},
            singleCheck: {type: Boolean, required: false, default: false},
        },
        methods: {
            updateCheck: function(id, newValue) {
                this.$store.dispatch('checkNode', {nodeID: id, newValue})
            },
            updateSelect: function(id, newValue) {
                this.$store.dispatch('selectNode', {nodeID: id, newValue})
            },
            onCheckChange: function(id, newValue) {
                this.treeEvents.checked(id, newValue);
            },
            onSelectChange: function(id, newValue) {
                this.treeEvents.selected(id, newValue);
            },
            beginDrag: function(e, nodeData) {
                this.draggingNodeID = nodeData.id;
            },
            endDrag: function(e, nodeData) {
                this.draggingNodeID = null;
            },
            getChildren: function(id) {
                return this.$store.getters.getNodeChildren(id);
            },
            registerDrop: function(e, nodeData) {
                this.$store.dispatch('makeChild', {nodeID: this.draggingNodeID, newParentID: nodeData.id});
            },
            registerDropAfter: function(e, nodeData) {
                this.$store.dispatch('moveAfter', {nodeID: this.draggingNodeID, newPreviousID: nodeData.id});
            },
            openContextMenu: function(e, id) {
                this.$refs.vuetreemenu.open(e, id);
            },
            beginAddChildNode: function(id) {
                this.$store.dispatch('addNode', {parent: id})
            },
            editNodeText: function(id) {
                this.editing = id;
            },
            endEditText: function(nodeID, newText) {
                this.editing = null;
                this.$store.commit('editText', {nodeID, newValue: newText})
            },
            reselectDescendants: function(nodeID, newValue) {
                this.$store.dispatch('selectNode', {nodeID, newValue})
            },
            // editNodeIcon: function(id) {
            //     console.log(id)
            // },
            makeRootNode: function() {
                this.$store.dispatch('addNode', {})
            },
            deleteNode: function(id) {
                this.$store.dispatch('deleteNode', id)
            },
        },
        computed: {
            rootNodes: function() {
                return this.$store.getters.getNodeChildren(null);
            },
            dragging: function() {
                return this.$store.getters.getNode(this.draggingNodeID);
            }
        },
        watch: {
            singleCheck: function(newValue, oldvalue) {
                this.$store.dispatch('changeSingleCheck', newValue);
            },
            separateSelection: function(newValue, oldvalue) {
                this.$store.dispatch('changeSeparateSelection', newValue);
            },
        },
        created: function() {
            if (this.singleCheck) {
                this.$store.dispatch('changeSingleCheck', true);
            } else if (!this.separateSelection) {
                this.$store.dispatch('changeSeparateSelection', false);
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

    .tree {
        margin-bottom: 0.1em;
    }

    .newNodeButton {
        margin-left: 1.5em;
    }
</style>
