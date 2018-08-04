<template>
    <div id="app" style="padding-bottom: 300px;">
        <h1>{{ msg }}</h1>
        <h2>Tree View</h2>
        <div>
            <div style="width:840px; margin: 0 auto;">
                <div style="font-size: 20px; width: 200px; text-align: left; display:inline-block; vertical-align: top; background-color: yellow;">
                    <br />
                    <v-tree :treeEvents="treeEvents" :separateSelection="true" :singleCheck="false" :namespace="namespace" :useImageIcons="false" :allowedChildrenCheck="allowedChildrenCheckTest" />
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
export default {
    name: 'app',
    data () {
        return {
            namespace: "tree2",
            msg: 'A Tree Plugin For VueX',
            treeEvents: {
                checked: function(id, newValue){console.log('checked', id, newValue)},
                selected: function(id, newValue){console.log('selected', id, newValue)},
                contextOptions: [
                    {label: "test", func: function(id){console.log("test", id)}},
                    {
                        label: "Get Leaves", 
                        func: this.consoleLeaves,
                    },
                ],
            },
            newStateName: "",
        }
    },
    methods: {
        consoleLeaves: function(id) {
            console.log(this.$store.getters[this.namespace + '/getLeaves'](id));
        },
        insertUnsorted: function() {
            let unsorted = [
                {id: 11, parent: 10, text: "test child"},
                {id: 10, text: "test parent"},
                {id: 12, parent: 10, text: "test child3"},
                // TODO: The following line breaks addition, since 12 has it's prev set to 11 during it's passthrough.
                //{id: 13, previousSibling: 11, parent: 10, text: "test child2"},
            ]
            this.$store.dispatch(this.namespace + '/addNodes', unsorted);
        },
        allowedChildrenCheckTest: function(nodeData) {
            if (nodeData.text.includes("NOCHILD")) {
                return false;
            }
            return true;
        },
        saveState: function(stateName) {
            this.$store.commit(this.namespace + "/saveState", stateName);
        },
        loadState: function(stateName) {
            this.$store.dispatch(this.namespace + "/switchState", stateName);
        },
    },
    computed: {
        states: function() {
            return this.$store.getters[this.namespace + '/getStates'];
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
