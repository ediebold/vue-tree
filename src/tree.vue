<template>
    <ul class="tree"> 
        <TreeNode :children="true"/>
        <TreeNode />
        <TreeNode />
    </ul>
</template>
<script>
    import TreeNode from './tree-node.vue'

    export default {
        name: 'VTree',
        components: {
            TreeNode
        }
    }
</script>

<style>
</style>
