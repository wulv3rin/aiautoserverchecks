<template>
    <div :settings="{settings:true}">
        <v-content><TableServerAlerts/></v-content>
        <v-content><TablePeertask/></v-content>
    </div>
</template>

<script>
import TableServerAlerts from './TableServerAlerts'
import TablePeertask from './TablePeertask'
export default {
    components: {
      TableServerAlerts,
      TablePeertask
    },
    data(){
        return {}
    }
}
</script>
<style>
</style>