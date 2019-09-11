<template>
  <div>
    <v-toolbar flat color="blue-grey lighten-5">
      <v-toolbar-title>Hängende Peertask:</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="text-xs-left pt-2">
        <v-btn :loading="loading" :disabled="loading" color="primary" @click="checkForNewPeerTask">Check  <v-icon dark right>search</v-icon> </v-btn>
        <v-btn :loading="loading" :disabled="loading" color="primary" @click="getDataFromApi">Refresh     <v-icon dark right>sync</v-icon></v-btn>
      </div>
      <v-dialog v-model="dialog" max-width="700px">
        <v-card>
          <v-card-title>
            <span class="headline">{{ formTitle }}</span>
          </v-card-title>

          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12 sm4 md4>
                  <v-text-field v-model="editedItem.customer" disabled label="Kunde"></v-text-field>
                </v-flex>
                <v-flex xs12 sm8 md8>
                  <v-text-field v-model="editedItem.serverURL" disabled label="Server Url"></v-text-field>
                </v-flex>
                <v-flex xs12 sm4 md4>
                  <v-text-field v-model="editedItem.peerKeys" disabled label="PeerKeys"></v-text-field>
                </v-flex>
                <v-flex xs12 sm8 md8>
                  <v-text-field v-model="editedItem.peerOid" disabled label="PeerOid"></v-text-field>
                </v-flex>
                <v-flex xs12 sm4 md4>
                  <v-text-field ref="TicketFocus" v-model="editedItem.ticketNr" @keyup.enter="save" label="Ticket Nr"></v-text-field>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" flat @click="close">Cancel</v-btn>
            <v-btn color="blue darken-1" flat @click="save">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-data-table
      :headers="headers"
      :items="rows"
      :pagination.sync="pagination"
      :total-items="totalRows"
      :loading="loading"
      :rows-per-page-items= [50,100,200,1000]
      class="elevation-1"
    >
      <template v-slot:items="props">
        <td>{{ props.item.customer }}</td>
        <td><a :href=props.item.serverURL target="_blank">{{ props.item.serverURL }}</a> </td>
      <!--  <td>{{ props.item.color }}</td> -->
        <td>{{ props.item.peerKeys }}</td>
        <td>{{ props.item.task }}</td>
        <td>{{ props.item.status }}</td>
        <td>{{ props.item.creationDate }}</td>
        <td>{{ props.item.counter }}</td>
        <td>{{ props.item.receiver }}</td>
      <!--  <td>{{ props.item.peerOid }}</td> --> 
      <!--  <td>{{ props.item.still_current }}</td> -->
        <td :class="{red: props.item.ticketNr >0 ? false:true}"> <a :href="'https://server1.ai-ag.de/Intranet/ticketsystem/EditTicket.jsp?TicketID=' + props.item.ticketNr" target="_blank"> {{ props.item.ticketNr }}</a></td>
        <td class="justify-center layout px-0">
          <v-icon small class="mr-2" @click="editItem(props.item)">edit</v-icon>
          <v-icon small              @click="deleteItem(props.item)">delete</v-icon>
        </td>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="initialize">Reset</v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        noTicket: true,

        dialog: false,
        totalRows: 0,
        loading: true,
        pagination: {
          descending: true,
          sortBy: 'creationDate'
        },
        headers: [
          { text: 'Kunde',          value: 'customer'     },
          { text: 'ServerURL',      value: 'serverURL'    },
      //    { text: 'Farbe',          value: 'color'        },
          { text: 'PeerKeys',       value: 'peerKeys'     },
          { text: 'Task',           value: 'task'         },
          { text: 'Status',         value: 'status'       },
          { text: 'Erstellungszeit',value: 'creationDate' },
          { text: 'Zähler',         value: 'counter'      },
          { text: 'Empfänger',      value: 'receiver'     },
      //    { text: 'peerOid',        value: 'peerOid'      },
      //    { text: 'still_current',  value: 'still_current'},
          { text: 'Ticket Nr.',     value: 'ticketNr'     },
          { text: 'Actions',        value: 'customer', sortable: false }
        ],
        rows: [],
        editedIndex: -1,
        editedItem: {
          customer: '',
          serverURL: 0,
          peerOid: 0,
          peerKeys: 0,
          ticketNr: 0
        },
        defaultItem: {
          customer: '',
          serverURL: 0,
          peerOid: 0,
          peerKeys: 0,
          ticketNr: 0
        }
      }
    },

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New Item' : 'Ticket Nr. ergänzen'
      }
    },

    watch: {
      dialog (val) {
        val || this.close()
        this.$nextTick(this.$refs.TicketFocus.focus);
      }
    },
    mounted () {
      this.getDataFromApi()
        .then(data => {
          this.rows = data.items
          this.totalRows = data.total
        })
    },
    //created () {
    //  this.initialize()
    //},

    methods: {
      getDataFromApi () {
        this.loading = true
        return new Promise((resolve) => {
          const { sortBy, descending, page, rowsPerPage } = this.pagination

          let items = {}
          
          getDbPeerTask().then((result) => {
          this.loading = false;
          items = result;
          const total = items.length

          if (this.pagination.sortBy) {
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
            //this.loading = false
            this.pagination.totalItems = total;
            resolve({
              items,
              total
            })
          });
        })
      },
      checkForNewPeerTask: async function () {
        this.loading = true
        deleteAllAlerts().then(() => {
        });
        //Prüfe ob es neue hängende Peertask gibt
        searchForNewPeerTask().then(() => {
          this.getDataFromApi();
        });
      },
      initialize () {
        this.rows = [
          {
            "customer": "0134_02_BeWaBe",
            "serverURL": "https://vergabeplattform-dritte.bwb.de/WorkServer/admin",
            "color": "Red",
            "peerKeys": "musternetlocalbwbexterne",
            "task": "USER",
            "status": "Endgueltig negativ empfangene Nachricht",
            "creationDate": "14.03.19 11:50",
            "counter": "3",
            "receiver": "musternetlocalbwbexterne",
        //    "peerOid": "54321-PeerTask-1697bd2b3e4-4ed4298d25c06c5d",
            "still_current": true,
            "ticketNr": 12234
          }
        ]
      },

      editItem (item) {
        this.editedIndex = this.rows.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
      },

      deleteItem (item) {
        const index = this.rows.indexOf(item)
        confirm('Are you sure you want to delete this item?') && this.rows.splice(index, 1)
        this.pagination.totalItems = this.rows.length;
        let data ={"peertaskoid" : item.peerOid}
        deletePeerTask(data);
      },

      close () {
        this.dialog = false
        setTimeout(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (this.editedIndex > -1) {
          let data = {
            "peerOid" : this.editedItem.peerOid,
            "key": "ticketNr",
            "value": this.editedItem.ticketNr
          }
          setTicketNr(data);
          Object.assign(this.rows[this.editedIndex], this.editedItem)
        } else {
          this.rows.push(this.editedItem)
        }
        this.close()
      }
    }
  }


async function getDbPeerTask() {
    const result = await fetch('/api/getPeerTask');
    if (result.status === 200) {
      return await result.json();
    }
}

async function searchForNewPeerTask() {
    const result = await fetch('/api/searchForNewPeerTask');
    if (result.status === 200) {
      return await result.json();
    } else {
    //  alert('Anfrage hat zu lange gedauert. ' + result.status + ':' + result.statusText + ':' + result.body);
    }
}
async function setTicketNr(data) {
    const result = await fetch('/api/updatePeerTask',
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

async function deletePeerTask(data) {
    const result = await fetch('/api/peerTask',
    { method: 'DELETE',
      body: JSON.stringify(data),
      headers:{'Content-Type': 'application/json'}
    });
    if (result.status === 200) {
      return await result.json();
    } else {
      //console.log('Konnte keine DB Daten ziehen');
    }
}

async function deleteAllAlerts() {
  const result = await fetch('/api/aIEALL',
  { method: 'DELETE',
      headers:{'Content-Type': 'application/json'}
    });
    if (result.status === 200) {
      return await result.json();
    } else {
      return [];
    }
}
</script>

<style>
table.v-table tbody td, table.v-table tbody th {
    height: 30px;
}

.theme--light.v-table thead th {
    color: #5a92c9a8;
}
.theme--light.v-datatable thead th.column.sortable.active {
    color: #1976d2;
    font-size: 16px;
}

.red {
  background-color: red;
}

</style>
