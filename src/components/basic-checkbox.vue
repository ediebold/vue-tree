<template>
    <input 
    type="checkbox" 
    :checked="check" 
    :indeterminate.prop="check =='indet'" 
    :disabled="disabled" />
</template>

<script>
    export default {
        name: 'BasicCheckbox',
        props: {
            check: {type: [Boolean, String], required: true},
            disabled: {type: Boolean, required: false, default: false},
        },
    }
</script>

<style >
    input {
        font-size: inherit;
    }
</style>
