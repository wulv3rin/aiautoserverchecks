<template>
    <div :settings="{settings:true}">
        <br>
        <br>
        <br>
      <v-toolbar flat color="blue-grey lighten-5">
        <v-toolbar-title>Serverliste</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" max-width="500px">
          <template v-slot:activator="{ on }">
            <v-btn color="primary" dark class="mb-2" v-on="on">Add Server</v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle }}</span>
            </v-card-title>
  
            <v-card-text>
              <v-container grid-list-md>
                <v-layout wrap>
                  <v-flex xs12 sm100 md40> 
                    <v-text-field v-model="editedItem.url" label="URL"></v-text-field>
                  </v-flex>
                  <v-flex xs19 sm6 md4>
                    <v-text-field v-model="editedItem.user" label="User"></v-text-field>
                  </v-flex>
                  <v-flex xs19 sm6 md4>
                    <v-text-field v-model="editedItem.password" label="Passwort" type="password"></v-text-field>
                  </v-flex>
                  <v-flex xs19 sm6 md4>
                    <v-text-field v-model="editedItem.customer" label="Kunde"></v-text-field>
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
          <td>{{ props.item.url }}</td>
          <td>{{ props.item.user }}</td>
          <td :style="{'-webkit-text-security': 'disc'}">{{ props.item.password }}</td>
          <td>{{ props.item.customer }}</td>
          <td class="justify-center layout px-0">
            <v-icon
              small
              class="mr-2"
              @click="editItem(props.item)"
            >
              edit
            </v-icon>
            <v-icon
              small
              @click="deleteItem(props.item)"
            >
              delete
            </v-icon>
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
    data(){
        return {
    dialog: false,
    totalRows: 0,
    loading: true,
    pagination: {
        descending: true,
        sortBy: 'url'
    },
    headers: [
      { text: 'URL',        value: 'url'},
      { text: 'Benutzer',   value: 'user' },
      { text: 'Passwort',   value: 'password' },
      { text: 'Kunde',      value: 'customer' },
      { text: 'Actions',    value: 'url', sortable: false }
    ],
    rows: [],
    editedIndex: -1,
    editedItem: {
      url: 'https://',
      user: 'Administrator',
      password: '',
      customer: ''
    },
    defaultItem: {
      url: 'https://',
      user: 'Administrator',
      password: '',
      customer: ''
    }
  }
  },

  computed: {
    formTitle () {
      return this.editedIndex === -1 ? 'New Server' : 'Edit Server'
    }
  },

  watch: {
    dialog (val) {
      val || this.close()
    },
    pagination: {
        handler () {
          this.getDataFromApi()
            .then(data => {
              this.rows = data.items
              this.totalRows = data.total
            })
        },
        deep: true
    }
  },
  mounted () {
    this.loading = true;
    this.getDataFromApi()
      .then(data => {
        this.rows = data.items
        this.totalRows = data.total
        //this.loading = false;
      });
  },

  methods: {
    getDataFromApi () {
        this.loading = true
        return new Promise((resolve) => {
          const { sortBy, descending, page, rowsPerPage } = this.pagination

          let items = {}
          
          getDbServers().then((result) => {
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
    initialize () {
      this.rows = [
        {
          url: 'https://affee.de/blabla',
          user: 'Administrator',
          password: 'abcd1234',
          customer: '0000_Demo'
        },
        {
          url: 'https://kaffee.de/blabla',
          user: 'Administrator',
          password: 'abcd1234',
          customer: '0010_Demo'
        },
        {
          url: 'https://demo.de/blabla',
          user: 'Administrator',
          password: 'abcd1234',
          customer: '0020_Demo'
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
      confirm('Server aus der Überwachung wirklich entfernen?') && this.rows.splice(index, 1)
      this.pagination.totalItems = this.rows.length;
      let data ={"url" : item.url}
      deleteServer(data);
    },

    close () {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      }, 300)
    },

    save () {
      let data = {
        "url" : this.editedItem.url,
        "user": this.editedItem.user,
        "password": this.editedItem.password,
        "customer": this.editedItem.customer
      }
      if (this.editedIndex > -1) {
        setNewServer(data);
        Object.assign(this.rows[this.editedIndex], this.editedItem)
      } else {
        setNewServer(data);
        this.rows.push(this.editedItem)
      }
      this.close()
    }
  }
}

async function getDbServers() {
    const result = await fetch('/api/getServerUrls');
    if (result.status === 200) {
      return await result.json();
    }
}

async function setNewServer(data) {
    const result = await fetch('/api/ServerUrl',
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

async function deleteServer(data) {
    const result = await fetch('/api/ServerUrl',
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
</script>
<style>
</style>