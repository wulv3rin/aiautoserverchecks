<template>
  <div>
    <template v-if="showAlerts">
      <v-toolbar flat color="blue-grey lighten-5">
        <v-toolbar-title>Server die nicht geprüft werden konnten:</v-toolbar-title>
      </v-toolbar>
    
      <v-data-table
        :headers="headersAlerts"
        :items="rowsAlerts"
        :options.sync="optionsAlerts"
        :server-items-length="totalRowsAlerts"
        :loading="loadingAlerts"
        :footer-props="{
          'items-per-page-options': [5, 10, 20, 100]
        }"
        class="elevation-1"
      >
        <template v-slot:item.serverURL="{ item }">
          <a :href="item.serverURL" target="_blank">{{ item.serverURL }}</a>
        </template>
        <template v-slot:no-data>
          <v-alert :value="true" color="green" icon="done">
            Alle Server konnten geprüft werden.
          </v-alert>
        </template>
      </v-data-table>    
      <br>
    </template>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        showAlerts: false,
        totalRowsAlerts: 0,
        rowsAlerts: [],
        loadingAlerts: true,
        optionsAlerts: {
          itemsPerPage: 10
        },
        headersAlerts: [
          { text: 'Kunde',          value: 'customer'     , align: 'start'  },
          { text: 'Server URL',     value: 'serverURL'    , align: 'start'  },
          { text: 'Fehlermeldung',  value: 'errorMessage' , align: 'start'  }
        ]
      }
    },
    watch: {
      optionsAlerts: {
        handler () {
          this.getDataFromApiAlerts()
            .then(data => {
              this.rowsAlerts = data.items
              this.totalRowsAlerts = data.total
            })
        },
        deep: true
      }
    },
    mounted () {
      this.getDataFromApiAlerts()
        .then(data => {
          this.rowsAlerts = data.items
          this.totalRowsAlerts = data.total
        });
      this.$root.$on('refresh-alerts', () => {
        this.getDataFromApiAlerts()
          .then(data => {
            this.rowsAlerts = data.items
            this.totalRowsAlerts = data.total
          });
      });
    },
    methods: {
       getDataFromApiAlerts () {
        this.loadingAlerts = true
        return new Promise((resolve) => {
          const { sortBy, sortDesc, page, itemsPerPage } = this.optionsAlerts

          getDbAdminInterfaceErrorMessages().then((result) => {
            if (!result) {
               this.showAlerts = false;
               resolve({ items: [], total: 0 });
               return;
            }
            let items = result;
            const total = items.length
            total>0 ? this.showAlerts=true : this.showAlerts=false
            
            if (sortBy && sortBy.length > 0) {
              items = items.sort((a, b) => {
                const sortA = a[sortBy[0]]
                const sortB = b[sortBy[0]]
                if (sortDesc[0]) {
                  if (sortA < sortB) return 1
                  if (sortA > sortB) return -1
                  return 0
                } else {
                  if (sortA < sortB) return -1
                  if (sortA > sortB) return 1
                  return 0
                }
              })
            }

            if (itemsPerPage > 0) {
              items = items.slice((page - 1) * itemsPerPage, page * itemsPerPage)
            }
            this.loadingAlerts = false
            resolve({
              items,
              total
            })
          });
        })
      }
    }
  }


  async function getDbAdminInterfaceErrorMessages() {
    try {
        const result = await fetch('/api/getAIE');
        if (result.ok) {
            return await result.json();
        }
    } catch (e) {
        console.error('Error fetching alerts:', e);
    }
    return [{"_id": "0","customer": "0","errorMessage": "Keine Daten vom Backend bekommen","serverURL": ""}]
  }
</script>