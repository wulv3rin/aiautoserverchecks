<template>
    <div :settings="{settings:true}">
        <v-container >
          <v-layout row wrap justify-start>
            <v-flex xs4 sm3 md3 lg2 xl2>
              <v-switch v-model="switchUpdatePTUsed" :label= "`Automatische Prüfung`"></v-switch>
            </v-flex>
            <v-flex xs4 sm3 md3 lg2 xl1>
              <v-text-field :disabled="!switchUpdatePTUsed" label="PeerTaskCheckCronJob" placeholder="0 58 * * * *" outline></v-text-field>
            </v-flex>
          </v-layout>
          <br>
          <v-layout row wrap justify-start>
            <v-flex xs4 sm3 md3 lg2 xl2>
              <v-switch v-model="switchSmtpUsed" :label= "`Automatischer Mailversand`"></v-switch>
            </v-flex>
            <v-flex>
            <v-form v-if="switchSmtpUsed">
              <v-text-field  label="MailCronJob" v-model="smtpCron" required></v-text-field>
              <v-text-field  label="Host"        v-model="smtpHost" required></v-text-field>
              <v-text-field  label="Port"        v-model="smtpPort" required></v-text-field>
              <v-text-field  label="User"        v-model="smtpUser"></v-text-field>
              <v-text-field  label="Password"    v-model="smtpPass"></v-text-field>
              <v-text-field  label="From"        v-model="smtpFrom" required></v-text-field>
              <v-text-field  label="FromName"    v-model="smtpFromName" required></v-text-field>
              <v-text-field  label="To"          v-model="smtpTo" required></v-text-field>
              <v-text-field  label="Betreff"     v-model="smtpSubject" required></v-text-field>
              </v-form>
            </v-flex>
          </v-layout>
          <v-btn @click="saveSettings" :loading="loading">Speichern</v-btn>
        </v-container>
        <br>
        <br>
    </div>
</template>

<script>
export default {
    data(){
        return {
    switchUpdatePTUsed: true,
    updatePTCron: '0 58 * * * *',
    switchSmtpUsed: true,
    smtpCron: '0 0 7 * * *',
    smtpHost: 'exchange.local',
    smtpPort: 25,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: 'support@ai-ag.de',
    smtpFromName: 'AutoServercheck',
    smtpTo: 'ahenkel@ai-ag.de',
    smtpSubject: 'AutoServerchecks'  
   }
  },

  computed: {
    formTitle () {
      return this.editedIndex === -1 ? 'New Server' : 'Edit Server'
    }
  },
  mounted () {
    settingsGet()
      .then(data => {
        this.switchUpdatePTUsed = data.updatePTUsed;
        this.smtpCron = data.smtpCron;
        this.switchSmtpUsed = data.smtpUsed;
        this.smtpHost = data.smtpHost;
        this.smtpPort = data.smtpPort;
        this.smtpUser = data.smtpUser;
        this.smtpPass = data.smtpPass;
        this.smtpFrom = data.smtpFrom;
        this.smtpFromName = data.smtpFromName;
        this.smtpTo   = data.smtpTo; 
        this.smtpSubject = data.smtpSubject;
      });
    this.loading = false;
  },

  methods: {
    saveSettings() {
      const data = {
        updatePTUsed: this.switchUpdatePTUsed,
        smtpCron : this.smtpCron,
        smtpUsed : this.switchSmtpUsed,
        smtpHost : this.smtpHost,
        smtpPort : this.smtpPort,
        smtpUser : this.smtpUser,
        smtpPass : this.smtpPass,
        smtpFrom : this.smtpFrom,
        smtpFromName : this.smtpFromName,
        smtpTo   : this.smtpTo,
        smtpSubject : this.smtpSubject
      }
      settingsUpdate(data).then((resolve)=>{
        if (resolve.settingsType) {
          //alert("Erfolgreich gespeichert");          
        }else{
          alert("Fehler beim Speichern aufgetreten");
        }
      }).catch(()=>{
        alert("Fehler beim Speichern aufgetreten");
      });
    }
  }
}

async function settingsGet() {
    const result = await fetch('/api/settings');
    if (result.status === 200) {
      return await result.json();
    }
}

async function settingsUpdate(data) {
    const result = await fetch('/api/settings',
    { method: 'PUT',
      body: JSON.stringify(data),
      headers:{'Content-Type': 'application/json'}
    });
    if (result.status === 200) {
      return await result.json();
    } else {
      //console.log('Konnte keine DB Daten ziehen');
    }
}

</script>
<style>
</style>