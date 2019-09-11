<template>
    <div :settings="{settings:true}">
        <v-content><TableServerList/></v-content>
        <br>
        <v-content><SmtpSettings/></v-content>
        <br>
    </div>
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