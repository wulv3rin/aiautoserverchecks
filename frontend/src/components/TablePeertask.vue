<template>
  <div>
    <v-toolbar flat color="blue-grey lighten-5">
      <v-toolbar-title>Hängende Peertask:</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="text-left pt-2">
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
            <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
            <v-btn color="blue darken-1" text @click="save">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-data-table
      :headers="headers"
      :items="rows"
      :options.sync="options"
      :server-items-length="totalRows"
      :loading="loading"
      :footer-props="{
        'items-per-page-options': [50, 100, 200, 1000]
      }"
      class="elevation-1"
    >
      <template v-slot:item.serverURL="{ item }">
        <a :href="item.serverURL" target="_blank">{{ item.serverURL }}</a>
      </template>
      <template v-slot:item.ticketNr="{ item }">
        <td :class="{ 'red': !(item.ticketNr > 0) }">
          <a :href="'https://server1.ai-ag.de/Intranet/ticketsystem/EditTicket.jsp?TicketID=' + item.ticketNr" target="_blank"> {{ item.ticketNr }}</a>
        </td>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)">edit</v-icon>
        <v-icon small              @click="deleteItem(item)">delete</v-icon>
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
        options: {
          sortBy: ['creationDate'],
          sortDesc: [true],
          itemsPerPage: 50
        },
        headers: [
          { text: 'Kunde',          value: 'customer'     },
          { text: 'ServerURL',      value: 'serverURL'    },
          { text: 'PeerKeys',       value: 'peerKeys'     },
          { text: 'Task',           value: 'task'         },
          { text: 'Status',         value: 'status'       },
          { text: 'Erstellungszeit',value: 'creationDate' },
          { text: 'Zähler',         value: 'counter'      },
          { text: 'Empfänger',      value: 'receiver'     },
          { text: 'Ticket Nr.',     value: 'ticketNr'     },
          { text: 'Actions',        value: 'actions', sortable: false }
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
      options: {
        handler () {
          this.getDataFromApi()
            .then(data => {
              this.rows = data.items
              this.totalRows = data.total
            })
        },
        deep: true
      },
      dialog (val) {
        val || this.close()
        this.$nextTick(() => {
          if (this.$refs.TicketFocus) {
            this.$refs.TicketFocus.focus();
          }
        });
      }
    },
    mounted () {
      this.getDataFromApi()
        .then(data => {
          this.rows = data.items
          this.totalRows = data.total
        })
    },

    methods: {
      getDataFromApi () {
        this.loading = true
        return new Promise((resolve) => {
          const { sortBy, sortDesc, page, itemsPerPage } = this.options

          getDbPeerTask().then((result) => {
            this.loading = false;
            if (!result) {
              resolve({ items: [], total: 0 });
              return;
            }
            let items = result;
            const total = items.length

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
    try {
        const result = await fetch('/api/getPeerTask');
        if (result.ok) {
            return await result.json();
        }
    } catch (e) {
        console.error('Error fetching peer tasks:', e);
    }
}

async function searchForNewPeerTask() {
    try {
        const result = await fetch('/api/searchForNewPeerTask');
        if (result.ok) {
            return await result.json();
        }
    } catch (e) {
        console.error('Error searching for new peer tasks:', e);
    }
}
async function setTicketNr(data) {
    try {
        const result = await fetch('/api/updatePeerTask', { 
            method: 'PUT',
            body: JSON.stringify(data),
            headers:{'Content-Type': 'application/json'}
        });
        if (result.ok) {
            const text = await result.text();
            return text ? JSON.parse(text) : {};
        }
    } catch (e) {
        console.error('Error setting ticket nr:', e);
    }
}

async function deletePeerTask(data) {
    try {
        const result = await fetch('/api/peerTask', { 
            method: 'DELETE',
            body: JSON.stringify(data),
            headers:{'Content-Type': 'application/json'}
        });
        if (result.ok) {
            const text = await result.text();
            return text ? JSON.parse(text) : {};
        }
    } catch (e) {
        console.error('Error deleting peer task:', e);
    }
}

async function deleteAllAlerts() {
    try {
        const result = await fetch('/api/aIEALL', { 
            method: 'DELETE',
            headers:{'Content-Type': 'application/json'}
        });
        if (result.ok) {
            const text = await result.text();
            return text ? JSON.parse(text) : [];
        }
    } catch (e) {
        console.error('Error deleting alerts:', e);
    }
    return [];
}
</script>

<style scoped>
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
  background-color: red !important;
}

</style>
