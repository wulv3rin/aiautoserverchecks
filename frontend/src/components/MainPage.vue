<template>
    <v-main>
        <v-container>
            <TableServerAlerts/>
            <br>
            <TablePeertask/>
        </v-container>
    </v-main>
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