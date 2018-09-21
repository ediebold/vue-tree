<template>
    <div id="app" style="padding-bottom: 300px;">
        <h1>{{ msg }}</h1>
        <h2>Tree View</h2>
        <div>
            <div style="width:440px; margin: 0 auto;">
                <div style="font-size: 21px; width: 300px; text-align: left; display:inline-block; vertical-align: top; background-color: yellow;">
                    <br />
                    <v-tree 
                    :treeEvents="treeEvents" 
                    :separateSelection="true"
                    :singleCheck="false" 
                    :namespace="namespace" 
                    :iconComponent="iconType" 
                    :iconPickComponent="false" 
                    :allowedChildrenCheck="allowedChildrenCheckTest" />
                    <br />
                </div>
                <button style="clear: both; display: block;" @click="insertUnsorted">Test Unsorted Insert</button>
                <button v-for="state in states" @click="loadState(state)">{{ state }}</button>
                <hr />
                <input type="text" v-model="newStateName" />
                <button @click="saveState(newStateName)">Save Current State</button>
            </div>
        </div>
    </div>
</template>

<script>

import ImageIcon from './components/image-icon.vue'

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
                    {label: "test", func: function(id){console.log("test", id)}},
                    {
                        label: "Get Leaves", 
                        func: this.consoleLeaves,
                    },
                ],
            },
            newStateName: "",
            iconType: ImageIcon
        }
    },
    methods: {
        consoleLeaves: function(id) {
            console.log(this.$store.getters[this.namespace + '/getLeaves'](id));
        },
        insertUnsorted: function() {
            let unsorted = [
                {id: 1, parent: null, previousSibling: null, text: "test", checked: true, link: "google.com", icon: "https://cpu-geodjango-media.s3.amazonaws.com/media/myphoto.png"},
                {id: 2, parent: null, previousSibling: 1, text: "test2", checked: true},
                {id: 8, parent: null, previousSibling: undefined, text: "test feature 11", checked: true},
                {id: 3, parent: 1, previousSibling: null, text: "test child", checked: false, icon: 'http://oxydy.com/wp-content/uploads/2018/02/test-img-300x194.png'},
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
        saveState: function(stateName) {
            this.$store.dispatch("saveCurrentTreeState", stateName);
        },
        loadState: function(stateName) {
            this.$store.dispatch("switchToTreeState", stateName);
        },
    },
    computed: {
        states: function() {
            return this.$store.getters[this.namespace + '/getTreeStateNames'];
        }
    }
}
</script>

<style>
#app {
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
