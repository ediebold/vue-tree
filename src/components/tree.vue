<template>
    <div>
        <vue-context ref="vuetreemenu">
            <ul class="options" slot-scope="child">
                <template v-if="defaultControls">
                    <li @click="addChildNode(child.data)">Add Child</li>
                    <li @click="beginEditText(child.data)">Edit Text</li>
                    <li @click="beginEditIcon($event, child.data)">Edit Icon</li>
                    <li @click="deleteNode(child.data)">Delete</li>
                    <li v-for="control in treeEvents.contextOptions" @click="control.func(child.data)">{{control.label}}</li>
                </template>
            </ul>
        </vue-context>
        <floating-icon-picker 
        v-if="!useImageIcons" 
        ref="floatingiconpicker" 
        @selectIcon="endEditIcon" />
        <div class="tree">
            <TreeNode 
            :data="{id: null}"
            :singleCheck="singleCheck"
            :getChildren="getChildren"
            :treeEventBus="treeEventBus"
            :checkboxComponent="checkboxComponent"
            :iconComponent="iconComponent"
            :editingText="editingText"
            :dragGroup="dragGroup" />
        </div>
        <slot name="footer">
            <button class="newNodeButton" @click="makeRootNode">New Root Node</button>
        </slot>
    </div>
</template>
<script>
    import Vue from 'vue'
    import TreeNode from './tree-node.vue'
    import {VueContext} from 'vue-context'
    import FloatingIconPicker from './floating-icon-picker.vue';
    import draggable from 'vuedraggable'


    import BasicIcon from './basic-icon.vue'
    import BasicCheckbox from './basic-checkbox.vue'

    export default {
        name: 'VTree',
        data: function() {
            return {
                editingText: null,
                editingIcon: null,
                defaultControls: true,
                treeEventBus: new Vue(),
            }
        },
        props: {
            namespace: {type: String, required: true},
            treeEvents: {type: Object, required: false, default: {}},
            separateSelection: {type: Boolean, required: false, default: true},
            singleCheck: {type: Boolean, required: false, default: false},
            useImageIcons: {type: Boolean, required: false, default: false},
            allowedChildrenCheck: {type: Function, required: false, default: null},
            checkboxComponent: {type: Object, required: false, default: () => BasicCheckbox},
            iconComponent: {type: Object, required: false, default: () => BasicIcon},
            dragGroup: {type: String, required: false, default: "vuex-tree"},
        },
        methods: {
            // Function passed down to nodes
            getChildren: function(id) {
                return this.$store.getters[this.namespace + '/getNodeChildren'](id);
            },
            //Event bus functions
            updateCheck: function(data) {
                this.$store.dispatch(this.namespace + '/checkNode', {nodeID: data.id, newValue: data.value})
            },
            updateSelect: function(data) {
                this.$store.dispatch(this.namespace + '/selectNode', {nodeID: data.id, newValue: data.value})
            },
            openContextMenu: function(data) {
                this.contextEvent = data.event.currentTarget;
                this.$refs.vuetreemenu.open(data.event, data.id);
            },
            reselectDescendants: function(data) {
                this.$store.dispatch(this.namespace + '/selectNode', {nodeID: data.id, newValue: data.value})
            },
            registerDropUnder: function(data) {
                let nodeID = data.event.item.attributes["data-node-id"].value
                let newParentID = null;
                if (data.event.to.attributes["data-node-id"]) {
                    newParentID = data.event.to.attributes["data-node-id"].value;
                }
                let newSiblings = this.getChildren(newParentID);
                let newPreviousID = null;
                if (data.event.newIndex > 0) {
                    if (data.event.from == data.event.to && data.event.newIndex > data.event.oldIndex) {
                        newPreviousID = newSiblings[data.event.newIndex].id;
                    } else {
                        newPreviousID = newSiblings[data.event.newIndex - 1].id;
                    }
                }
                this.$store.dispatch(this.namespace + '/makeChild', {nodeID: nodeID, newParentID: newParentID, newPreviousID: newPreviousID});
            },
            //Editing
            beginEditText: function(id) {
                this.editingText = id;
            },
            endEditText: function(data) {
                this.editingText = null;
                this.$store.commit(this.namespace + '/editText', {nodeID: data.id, newValue: data.newText})
            },
            beginEditIcon: function(e, id) {
                this.editingIcon = id;
                this.$refs.floatingiconpicker.open(this.contextEvent);
            },
            endEditIcon: function(newIcon) {
                this.$store.commit(this.namespace + '/editIcon', {nodeID: this.editingIcon, newValue: newIcon})
                this.editingIcon = null;
            },
            // Tree manipulation
            addChildNode: function(id) {
                this.$store.dispatch(this.namespace + '/addNode', {parent: id})
            },
            deleteNode: function(id) {
                this.$store.dispatch(this.namespace + '/deleteNode', id)
            },
            makeRootNode: function() {
                this.$store.dispatch(this.namespace + '/addNode', {})
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

            //Create event bus hooks
            this.treeEventBus.$on("context", this.openContextMenu);
            this.treeEventBus.$on("endTextUpdate", this.endEditText);
            this.treeEventBus.$on("updateCheck", this.updateCheck);
            this.treeEventBus.$on("updateSelect", this.updateSelect);
            this.treeEventBus.$on("reselectDescendants", this.reselectDescendants);
            this.treeEventBus.$on("registerDropUnder", this.registerDropUnder);


            this.$store.subscribe(mutation => {
                if (mutation.type === this.namespace + '/checkNode') {
                    this.treeEvents.checked(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/selectNode') {
                    this.treeEvents.selected(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/switchState') {
                    //TODO: not do every single node
                    if (!this.$store.getters[this.namespace + '/getStates'].includes(mutation.payload)) {
                        return;
                    }
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
            draggable,
        }
    }
</script>

<style lang="stylus">
    .v-context
        width: 6.5em !important

        ul, li
            padding: 0 !important
        ul
            font-size: inherit !important
            font-weight: normal !important
        li
            border-bottom: 1px #CCC solid !important

    .tree
        margin-bottom: 0.1em
        white-space: nowrap

    .newNodeButton
        margin-left: 1.5em
</style>
