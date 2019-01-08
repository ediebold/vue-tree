<template>
    <div class="cap-width">
        <vue-context ref="vuetreemenu">
            <ul class="options" slot-scope="child">
                <template v-if="defaultControls">
                    <li @click="addChildNode(child.data)">Add Child</li>
                    <li @click="beginEditText(child.data)">Edit Text</li>
                    <li @click="beginEditIcon($event, child.data)" v-if="hasIconSlot">Edit Icon</li>
                    <li @click="deleteNode(child.data)">Delete</li>
                </template>
                <li 
                v-for="control in treeEvents.contextOptions" 
                v-if="child.data && (!control.show || control.show && control.show(child.data))" 
                @click="control.func(child.data)">
                    {{control.label}}
                </li>
            </ul>
        </vue-context> 
        <div 
        v-if="hasIconSlot && editingIcon"
        class="iconPickerContainer"
        :style="iconPickerStyle">
            <slot name="icon_picker" :endEditIcon="endEditIcon">{{ endEditIcon}}</slot>
        </div>
        <div class="tree">
            <TreeNode 
            :nodeID="null"
            :getNodeData="getNodeData"
            :treeEventBus="treeEventBus"
            :editingText="editingText"
            :dragGroup="dragGroup">
                <slot v-for="slot in Object.keys($slots)" :name="slot" :slot="slot"/>
                <template v-for="slot in Object.keys($scopedSlots)" :slot="slot" slot-scope="scope">
                    <slot :name="slot" v-bind="scope"/>
                </template>
            </TreeNode>
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
    import draggable from 'vuedraggable'

    export default {
        name: 'VTree',
        data: function() {
            return {
                editingText: null,
                editingIcon: null,
                defaultControls: true,
                treeEventBus: new Vue(),
                iconPickerTop: 0,
                iconPickerLeft: 0,
            }
        },
        props: {
            namespace: {type: String, required: true},
            treeEvents: {type: Object, required: false, default: {}},
            allowedChildrenCheck: {type: Function, required: false, default: null},
            usesScenes: {type: Boolean, required: false, default: true},
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
            beginEditText: function(nodeData) {
                this.editingText = nodeData.id;
            },
            endEditText: function(data) {
                this.editingText = null;
                this.$store.commit(this.namespace + '/editNodeField', 
                    {nodeID: data.id, field: "text", newValue: data.newText})
            },
            beginEditIcon: function(e, nodeData) {
                this.editingIcon = nodeData.id;
                let rect = e.target.parentNode.firstChild.getBoundingClientRect();
                this.iconPickerTop = rect.top;
                this.iconPickerLeft = rect.left;
            },
            endEditIcon: function(newIcon) {
                if (newIcon == null) {
                    this.editingIcon = null;
                    return;
                };
                this.$store.commit(this.namespace + '/editNodeField', 
                    {nodeID: this.editingIcon, field: "icon", newValue: newIcon})
                this.editingIcon = null;
            },
            // Tree manipulation
            addChildNode: function(nodeData) {
                this.$store.commit(this.namespace + '/addNodes', [{parent: nodeData.id, text: "New Child"}])
            },
            deleteNode: function(nodeData) {
                this.$store.commit(this.namespace + '/deleteNode', {nodeID: nodeData.id})
            },
            makeRootNode: function() {
                this.$store.commit(this.namespace + '/addNodes', [{text: "New Node"}])
            },
        },
        computed: {
            hasIconSlot() {
                return !!this.$scopedSlots['icon_picker'];
            },
            iconPickerStyle() {
                return { top: this.iconPickerTop + "px", left: this.iconPickerLeft + "px"};
            }
        },
        watch: {
            allowedChildrenCheck: function(newValue, oldvalue) {
                this.$store.commit(this.namespace + '/setAllowedChildrenCheck', newValue);
            },
            usesScenes: function(newValue, oldvalue) {
                this.$store.commit(this.namespace + '/setIgnoreGlobalScenes', !newValue);
            },
        },
        created: function() {
            if (this.allowedChildrenCheck) {
                this.$store.commit(this.namespace + '/setAllowedChildrenCheck', this.allowedChildrenCheck);
            }
            this.$store.commit(this.namespace + '/setIgnoreGlobalScenes', !this.usesScenes);

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
                    for (let node of this.$store.getters[this.namespace + '/getNodesArrayBFS']) {
                        this.treeEvents.checked(node.id, node.checked);
                    }
                }
            })
        },
        components: {
            TreeNode,
            VueContext,
            draggable,
        }
    }
</script>

<style lang="stylus">
    .v-context
        -webkit-user-select: none
        -moz-user-select: none
        -ms-user-select: none
        user-select: none
        width: 6.5em !important

        ul, li
            padding: 0 !important
        ul
            font-size: inherit !important
            font-weight: normal !important
        li
            border-bottom: 1px #CCC solid !important

    .tree
        max-width: 100%
        margin-bottom: 0.1em
        white-space: nowrap
        line-height: 1
        -webkit-user-select: none
        -moz-user-select: none
        -ms-user-select: none
        user-select: none

        li 
            list-style: none

    .newNodeButton
        margin-left: 1.5em

    .cap-width
        max-width: 100%

    .iconPickerContainer {
        width: 18em;
        z-index: 9999;
        position: absolute; 
    }
</style>
