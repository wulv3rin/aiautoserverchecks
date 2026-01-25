<template>
    <v-main>
        <v-container>
            <TableServerList/>
            <br>
            <SmtpSettings/>
        </v-container>
    </v-main>
</template>

<script>
import TableServerList from './TableServerList'
import SmtpSettings from './SmtpSettings'
export default {
    components: {
      TableServerList,
      SmtpSettings
    },
    data(){
        return {}
    }
}
</script>
<style>
</style>