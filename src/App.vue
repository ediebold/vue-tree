<template>
    <div id="app" style="padding-bottom: 300px;">
        <h1>{{ msg }}</h1>
        <h2>Tree View</h2>
        <div>
            <div style="width:440px; margin: 0 auto;">
                <div class="playground">
                    <br />
                    <v-tree 
                    :treeEvents="treeEvents"
                    :namespace="namespace"
                    :allowedChildrenCheck="allowedChildrenCheckTest">
                        <template slot="node_icon" slot-scope="{nodeData}">
                            <font-awesome-icon 
                            :icon="nodeData.icon" 
                            fixed-width />
                        </template>
                        <!-- <template slot="node_checkbox" slot-scope="{nodeData}">
                            {{nodeData.checked}}
                        </template> -->
                        <template slot="icon_picker" slot-scope="{endEditIcon}">
                            <font-awesome-picker 
                            v-on-clickaway="() => endEditIcon(null)"
                            @selectIcon="endEditIcon($event.className)" />
                        </template>
                    </v-tree>
                    <br />
                </div>
                <button style="clear: both; display: block;" @click="insertUnsorted">Test Unsorted Insert</button>
                <button v-for="scene in scenes" @click="loadScene(scene)">{{ scene }}</button>
                <hr />
                <input type="text" v-model="newSceneName" />
                <button @click="saveScene(newSceneName)">Save Current Scene</button>
                <hr />
                <input type="text" v-model="newFieldName" />
                <button @click="saveField(newFieldName)">Add Tracked Field</button>
                <hr />
                <template v-if="trackedFields">
                    <button v-for="field in trackedFields" @click="deleteField(field)">{{ field }}</button>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
//Font-awesome icons for default icon node.
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { dom } from '@fortawesome/fontawesome-svg-core'
dom.watch() // This will kick of the initial replacement of i to svg tags and configure a MutationObserver
library.add(fas)
library.add(far)


import { fontAwesomePicker } from 'font-awesome-picker';
import { directive as onClickaway } from 'vue-clickaway';


export default {
    name: 'app',
    data () {
        return {
            namespace: "tree2",
            msg: 'A Tree Plugin For VueX',
            treeEvents: {
                checked: function(id, newValue){/*console.log('checked', id, newValue)*/},
                selected: function(id, newValue){/*console.log('selected', id, newValue)*/},
                contextOptions: [
                    {label: "Test", func: function(id){console.log("test", id)}},
                    {
                        label: "Get Leaves", 
                        func: this.consoleLeaves,
                    },
                    {
                        label: "Only roots", 
                        show: function(nodeData){ return nodeData.parent == null;},
                        func: this.consoleLeaves,
                    },
                ],
            },
            newSceneName: "",
            newFieldName: "",
        }
    },
    methods: {
        consoleLeaves: function(id) {
            console.log(this.$store.getters[this.namespace + '/getLeaves'](id));
        },
        insertUnsorted: function() {
            let unsorted = [
                {id: 1, parent: null, previousSibling: null, text: "test", checked: false, icon: "address-book", labelColor: "#FF9900"},
                {id: 2, parent: null, previousSibling: 1, text: "test2", checked: false, link: "www.google.com"},
                {id: 8, parent: null, previousSibling: undefined, text: "test feature 11", checked: true},
                {id: 3, parent: 1, previousSibling: null, text: "test child", checked: false, icon: 'coffee'},
                {id: 4, parent: 1, previousSibling: 3, text: "test child 2", checked: true},
                {id: 6, parent: 3, previousSibling: null, text: "test feature", checked: true},
                {id: 7, parent: 3, previousSibling: 6, text: "test feature 2", checked: true},
            ]
            this.$store.commit(this.namespace + '/addNodes', unsorted);
        },
        allowedChildrenCheckTest: function(nodeData) {
            if (nodeData.text.includes("NOCHILD")) {
                return false;
            }
            return true;
        },
        saveScene: function(sceneName) {
            this.$store.dispatch("saveCurrentAsScene", sceneName);
        },
        loadScene: function(sceneName) {
            this.$store.dispatch("switchToScene", sceneName);
        },
        saveField: function(fieldName) {
            this.$store.commit(this.namespace + "/addField", fieldName);
            this.newFieldName = "";
        },
        deleteField: function(fieldName) {
            this.$store.commit(this.namespace + "/removeField", fieldName);
        },
    },
    computed: {
        scenes: function() {
            return this.$store.getters[this.namespace + '/getSceneNames'];
        },
        trackedFields: function() {
            return this.$store.getters[this.namespace + '/getTrackedFields'];
        },
    },
    components: {
        'font-awesome-icon': FontAwesomeIcon,
        'font-awesome-picker': fontAwesomePicker,
    },
    directives: {
        onClickaway: onClickaway,
    },
}
</script>

<style>
#app {
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

.playground {
    font-size: 18px;
    width: 300px;
    height: 400px;
    text-align: left;
    display:inline-block;
    vertical-align: top;
    background-color: yellow;
    overflow-y: scroll;
    scrollbar-width: none;
}
.playground::-webkit-scrollbar {
    display: none;
}
</style>
