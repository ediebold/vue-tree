<template>
    <img 
    v-if="icon"
    class="tree-basic-image"
    type="checkbox" 
    :src="icon" />
</template>

<script>
    export default {
        name: 'ImageIcon',
        props: {
            icon: {type: String, required: true},
            iconColor: {type: String, required: false, default: '#000'},
        },
    }
</script>

<style>
    img.tree-basic-image {
        width: 1em;
        height: 1em;
    }
</style>