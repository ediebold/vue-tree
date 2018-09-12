<template>
    <img 
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
</style>