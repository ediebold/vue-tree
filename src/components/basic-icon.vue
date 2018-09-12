<template>
    <font-awesome-icon
    v-if="icon"
    :icon="icon" 
    :style="{color: iconColor}" />
</template>

<script>
    export default {
        name: 'BasicIcon',
        props: {
            icon: {type: [String, Boolean], required: false, default: false},
            iconColor: {type: String, required: false, default: '#000'},
        },
    }
</script>

<style>
</style>