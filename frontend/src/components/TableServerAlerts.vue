<template>
  <div>
    <template v-if="showAlerts">
      <v-toolbar flat color="blue-grey lighten-5">
        <v-toolbar-title>Server die nicht geprüft werden konnten:</v-toolbar-title>
      </v-toolbar>
    
      <v-data-table
        :hide-actions= true
        :hide-headers= false
        :headers="headersAlerts"
        :items="rowsAlerts"
        :pagination.sync="paginationAlerts"
        :total-items="totalRowsAlerts"
        :loading="loadingAlerts"
        class="elevation-1"
      >
        <template v-slot:items="props">
          <td class="text-xs-left">{{ props.item.customer }}</td>
          <td class="text-xs-left"><a :href=props.item.serverURL target="_blank">{{ props.item.serverURL }}</a></td>
          <td class="text-xs-left">{{ props.item.errorMessage }}</td>
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
        paginationAlerts: {},
        headersAlerts: [
          { text: 'Kunde',          value: 'customer'     , align: 'left'  },
          { text: 'Server URL',     value: 'serverURL'    , align: 'left'  },
          { text: 'Fehlermeldung',  value: 'errorMessage' , align: 'left'  }
        ]
      }
    },
    watch: {
      paginationAlerts: {
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
        })
    },
    methods: {
       getDataFromApiAlerts () {
        this.loadingAlerts = true
        return new Promise((resolve) => {
          const { sortBy, descending, page, rowsPerPage } = this.paginationAlerts

          let items = {}
          
          getDbAdminInterfaceErrorMessages().then((result) => {
          let i = [];
          result.forEach(x => {
            i.push(x);
          });
          items = i;
          const total = items.length
          total>0 ? this.showAlerts=true : this.showAlerts=false
          if (this.paginationAlerts.sortBy) {
            items = items.sort((a, b) => {
              const sortA = a[sortBy]
              const sortB = b[sortBy]
              if (descending) {
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

          if (rowsPerPage > 0) {
            items = items.slice((page - 1) * rowsPerPage, page * rowsPerPage)
          }
            this.loadingAlerts = false
            this.paginationAlerts.totalItems = total;
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
    const result = await fetch('/api/getAIE');
    if (result.status === 200) {
      return await result.json();
    } else {
      return [{"_id": "0","customer": "0","errorMessage": "Keine Daten vom Backend bekommen","serverURL": ""}]
    }
  }
</script>