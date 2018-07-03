<template>
    <div id="app" style="padding-bottom: 300px;">
        <h1>{{ msg }}</h1>
        <h2>Tree View</h2>
        <div>
            <div style="width:840px; margin: 0 auto;">
                <div style="width: 200px; text-align: left; display:inline-block; vertical-align: top;">
                    <br />
                    <v-tree />
                    <br />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'app',
        data () {
            return {
                msg: 'A Tree Plugin For Vue2', 
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
