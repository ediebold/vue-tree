<template>
    <font-awesome-picker v-if="show" @selectIcon="emitSelectIcon" :style="fapStyle"></font-awesome-picker>
</template>

<script>
    import { fontAwesomePicker } from 'font-awesome-picker';

    export default {
        name: 'FloatingIconPicker',
        data: function() {
            return {
                fapTop: 0,
                fapLeft: 0,
                show: false,
            }
        },
        computed: {
            fapStyle: function() {
                return { top: this.fapTop + "px", left: this.fapLeft + "px"}
            }
        },
        methods: {
            open(element) {
                this.show = true;
                let rect = element.getBoundingClientRect();
                this.fapTop = rect.bottom;
                this.fapLeft = rect.left;
            },
            close() {
                this.show = false;
            },
            emitSelectIcon(selectedIcon) {
                this.close();
                this.$emit("selectIcon", selectedIcon.className);
            },
        },
        components: {
            'font-awesome-picker': fontAwesomePicker,
        }
    }
</script>

<style>
    #iconPicker {
        width: 18em;
        z-index: 9999;
        position: absolute; 
    }
    
    .iconPicker__icons .item {
        width: 1em;
        height: 1em;
    }

    .iconPicker__header input {
        width: 17em;
    }
</style>
