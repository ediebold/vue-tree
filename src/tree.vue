<template>
    <div>
        <vue-context ref="vuetreemenu">
            <ul class="options" slot-scope="child">
                <template v-if="defaultControls">
                    <li @click="beginAddChildNode(child.data)">Add Child</li>
                    <li @click="editNodeText(child.data)">Edit Text</li>
                    <li @click="editNodeIcon($event, child.data)">Edit Icon</li>
                    <li @click="deleteNode(child.data)">Delete</li>
                    <li v-for="control in treeEvents.contextOptions" @click="control.func(child.data)">{{control.label}}</li>
                </template>

            </ul>
        </vue-context>
        <floating-icon-picker v-if="!useImageIcons" ref="floatingiconpicker" @selectIcon="endEditIcon"></floating-icon-picker>
        <ul class="tree"> 
            <TreeNode v-for="node in rootNodes" :key="node.id" :data="node" :updateCheck="updateCheck" :updateSelect="updateSelect" :getChildren="getChildren" :singleCheck="singleCheck"
            :dragging="dragging" :editing="editing" :editingIcon="editingIcon" :reselectDescendants="reselectDescendants" :endEditText="endEditText" :beginDrag="beginDrag" :endDrag="endDrag" :registerDrop="registerDrop" :registerDropAfter="registerDropAfter" :context="openContextMenu"
            :useImageIcons="useImageIcons" />
        </ul>
        <button class="newNodeButton" @click="makeRootNode">New Root Node</button>
    </div>
</template>
<script>
    import TreeNode from './tree-node.vue'
    import {VueContext} from 'vue-context'
    import FloatingIconPicker from './floating-icon-picker.vue';

    export default {
        name: 'VTree',
        data: function() {
            return {
                draggingNodeID: null,
                editing: null,
                editingIcon: null,
                defaultControls: true,
            }
        },
        props: {
            namespace: {type: String, required: true},
            treeEvents: {type: Object, required: false, default: {}},
            separateSelection: {type: Boolean, required: false, default: true},
            singleCheck: {type: Boolean, required: false, default: false},
            useImageIcons: {type: Boolean, required: false, default: false},
            allowedChildrenCheck: {type: Function, required: false, default: null},
        },
        methods: {
            updateCheck: function(id, newValue) {
                this.$store.dispatch(this.namespace + '/checkNode', {nodeID: id, newValue})
            },
            updateSelect: function(id, newValue) {
                this.$store.dispatch(this.namespace + '/selectNode', {nodeID: id, newValue})
            },
            beginDrag: function(e, nodeData) {
                this.draggingNodeID = nodeData.id;
            },
            endDrag: function(e, nodeData) {
                this.draggingNodeID = null;
            },
            getChildren: function(id) {
                return this.$store.getters[this.namespace + '/getNodeChildren'](id);
            },
            registerDrop: function(e, nodeData) {
                this.$store.dispatch(this.namespace + '/makeChild', {nodeID: this.draggingNodeID, newParentID: nodeData.id});
            },
            registerDropAfter: function(e, nodeData) {
                this.$store.dispatch(this.namespace + '/moveAfter', {nodeID: this.draggingNodeID, newPreviousID: nodeData.id});
            },
            openContextMenu: function(e, id) {
                this.contextEvent = e.currentTarget;
                this.$refs.vuetreemenu.open(e, id);
            },
            beginAddChildNode: function(id) {
                this.$store.dispatch(this.namespace + '/addNode', {parent: id})
            },
            editNodeText: function(id) {
                this.editing = id;
            },
            endEditText: function(nodeID, newText) {
                this.editing = null;
                this.$store.commit(this.namespace + '/editText', {nodeID, newValue: newText})
            },
            reselectDescendants: function(nodeID, newValue) {
                this.$store.dispatch(this.namespace + '/selectNode', {nodeID, newValue})
            },
            editNodeIcon: function(e, id) {
                this.editingIcon = id;
                this.$refs.floatingiconpicker.open(this.contextEvent);
            },
            endEditIcon: function(newIcon) {
                this.$store.commit(this.namespace + '/editIcon', {nodeID: this.editingIcon, newValue: newIcon})
                this.editingIcon = null;
            },
            makeRootNode: function() {
                this.$store.dispatch(this.namespace + '/addNode', {})
            },
            deleteNode: function(id) {
                this.$store.dispatch(this.namespace + '/deleteNode', id)
            },
        },
        computed: {
            rootNodes: function() {
                return this.$store.getters[this.namespace + '/getNodeChildren'](null);
            },
            dragging: function() {
                return this.$store.getters[this.namespace + '/getNode'](this.draggingNodeID);
            },
        },
        watch: {
            singleCheck: function(newValue, oldvalue) {
                this.$store.dispatch(this.namespace + '/changeSingleCheck', newValue);
            },
            separateSelection: function(newValue, oldvalue) {
                this.$store.dispatch(this.namespace + '/changeSeparateSelection', newValue);
            },
            allowedChildrenCheck: function(newValue, oldvalue) {
                this.$store.dispatch(this.namespace + '/changeAllowedChildrenCheck', newValue);
            },
        },
        created: function() {
            if (this.singleCheck) {
                this.$store.dispatch(this.namespace + '/changeSingleCheck', true);
            }
            if (!this.separateSelection) {
                this.$store.dispatch(this.namespace + '/changeSeparateSelection', false);
            }
            if (this.allowedChildrenCheck) {
                this.$store.dispatch(this.namespace + '/changeAllowedChildrenCheck', this.allowedChildrenCheck);
            }
            this.$store.subscribe(mutation => {
                if (mutation.type === this.namespace + '/checkNode') {
                    this.treeEvents.checked(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/selectNode') {
                    this.treeEvents.selected(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/switchState') {
                    //TODO: not do every single node
                    let nodes = this.$store.getters[this.namespace + '/getNodes'];
                    for (let node of nodes) {
                        this.treeEvents.checked(node.id, node.checked);
                    }
                }
            })
        },
        components: {
            TreeNode,
            VueContext,
            'floating-icon-picker': FloatingIconPicker,
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
        white-space: nowrap;
    }

    .newNodeButton {
        margin-left: 1.5em;
    }
</style>
