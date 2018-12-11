<template>
    <div>
        <vue-context ref="vuetreemenu">
            <ul class="options" slot-scope="child">
                <template v-if="defaultControls">
                    <li @click="addChildNode(child.data)">Add Child</li>
                    <li @click="beginEditText(child.data)">Edit Text</li>
                    <li @click="beginEditIcon($event, child.data)" v-if="iconPickComponent">Edit Icon</li>
                    <li @click="deleteNode(child.data)">Delete</li>
                </template>
                <li v-for="control in treeEvents.contextOptions" @click="control.func(child.data)">{{control.label}}</li>
            </ul>
        </vue-context>
        <template v-if="iconPickComponent">
            <component
            :is="iconPickComponent"
            ref="iconPicker" 
            @selectIcon="endEditIcon" />
        </template>
        <div class="tree">
            <TreeNode 
            :nodeID="null"
            :getNodeData="getNodeData"
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
            allowedChildrenCheck: {type: Function, required: false, default: null},
            checkboxComponent: {type: Object, required: false, default: () => BasicCheckbox},
            iconComponent: {type: Object, required: false, default: () => BasicIcon},
            iconPickComponent: {type: [Boolean, Object], required: false, default: () => FloatingIconPicker},
            dragGroup: {type: String, required: false, default: "vuex-tree"},
        },
        methods: {
            // Function passed down to nodes
            getNodeData: function(id) {
                if (id == null) {
                    return {children: this.$store.getters[this.namespace + '/getRootNodes']};
                }
                return this.$store.getters[this.namespace + '/getNodes'][id];
            },
            //Event bus functions
            updateCheck: function(data) {
                this.$store.commit(this.namespace + '/editNodeField', {nodeID: data.id, field: "checked", newValue: data.value});
            },
            updateSelect: function(data) {
                this.$store.commit(this.namespace + '/editNodeField', {nodeID: data.id, field: "selected", newValue: data.value});
            },
            openContextMenu: function(data) {
                this.contextEvent = data.event.currentTarget;
                this.$refs.vuetreemenu.open(data.event, data.id);
            },
            reselectDescendants: function(data) {
                this.$store.commit(this.namespace + '/editNodeField', {nodeID: data.id, field: "selected", newValue: data.value})
            },
            registerDropUnder: function(data) {
                let nodeID = data.event.item.attributes["data-node-id"].value
                let newParentID = null;
                if (data.event.to.attributes["data-node-id"]) {
                    newParentID = data.event.to.attributes["data-node-id"].value;
                }
                let newSiblings = this.getNodeData(newParentID).children;
                let newPreviousID = null;
                if (data.event.newIndex > 0) {
                    if (data.event.from == data.event.to && data.event.newIndex > data.event.oldIndex) {
                        newPreviousID = newSiblings[data.event.newIndex];
                    } else {
                        newPreviousID = newSiblings[data.event.newIndex - 1];
                    }
                }
                this.$store.commit(this.namespace + '/moveNode', {nodeID: nodeID, newParentID: newParentID, newPreviousID: newPreviousID});
            },
            //Editing
            beginEditText: function(id) {
                this.editingText = id;
            },
            endEditText: function(data) {
                this.editingText = null;
                this.$store.commit(this.namespace + '/editNodeField', 
                    {nodeID: data.id, field: "text", newValue: data.newText})
            },
            beginEditIcon: function(e, id) {
                this.editingIcon = id;
                this.$refs.iconPicker.open(this.contextEvent);
            },
            endEditIcon: function(newIcon) {
                this.$store.commit(this.namespace + '/editNodeField', 
                    {nodeID: this.editingIcon, field: "icon", newValue: newIcon})
                this.editingIcon = null;
            },
            // Tree manipulation
            addChildNode: function(id) {
                this.$store.commit(this.namespace + '/addNodes', [{parent: id, text: "New Child"}])
            },
            deleteNode: function(id) {
                this.$store.commit(this.namespace + '/deleteNode', {nodeID: id})
            },
            makeRootNode: function() {
                this.$store.commit(this.namespace + '/addNodes', [{text: "New Node"}])
            },
        },
        watch: {
            allowedChildrenCheck: function(newValue, oldvalue) {
                this.$store.commit(this.namespace + '/setAllowedChildrenCheck', newValue);
            },
        },
        created: function() {
            if (this.allowedChildrenCheck) {
                this.$store.commit(this.namespace + '/setAllowedChildrenCheck', this.allowedChildrenCheck);
            }

            //Create event bus hooks
            this.treeEventBus.$on("context", this.openContextMenu);
            this.treeEventBus.$on("endTextUpdate", this.endEditText);
            this.treeEventBus.$on("updateCheck", this.updateCheck);
            this.treeEventBus.$on("updateSelect", this.updateSelect);
            this.treeEventBus.$on("reselectDescendants", this.reselectDescendants);
            this.treeEventBus.$on("registerDropUnder", this.registerDropUnder);


            this.$store.subscribe(mutation => {
                if (mutation.type === this.namespace + '/editNodeField' && mutation.payload.field == "checked" && this.treeEvents.checked) {
                    this.treeEvents.checked(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/moveNode' && this.treeEvents.moveNode) {
                    this.treeEvents.moveNode(mutation.payload);
                } else if (mutation.type === this.namespace + '/editNodeField' && mutation.payload.field == "selected" && this.treeEvents.selected) {
                    this.treeEvents.selected(mutation.payload.nodeID, mutation.payload.newValue);
                } else if (mutation.type === this.namespace + '/switchToScene' && this.treeEvents.checked) {
                    for (let rootNode of this.$store.getters[this.namespace + '/getNodes']) {
                        this.treeEvents.checked(rootNode.id, rootNode.checked);
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
        line-height: 1

        li 
            list-style: none

    .newNodeButton
        margin-left: 1.5em
</style>
