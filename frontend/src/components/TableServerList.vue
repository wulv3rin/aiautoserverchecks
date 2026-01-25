<template>
    <div>
        <br>
        <br>
        <br>
      <v-toolbar flat color="blue-grey lighten-5">
        <v-toolbar-title>Serverliste</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" max-width="500px">
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" dark class="mb-2" v-on="on" v-bind="attrs">Add Server</v-btn>
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
        <template v-slot:item.password="{ item }">
          <td :style="{'-webkit-text-security': 'disc'}">{{ item.password }}</td>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon
            small
            class="mr-2"
            @click="editItem(item)"
          >
            edit
          </v-icon>
          <v-icon
            small
            @click="deleteItem(item)"
          >
            delete
          </v-icon>
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
    options: {
        sortBy: ['url'],
        sortDesc: [true],
        itemsPerPage: 50
    },
    headers: [
      { text: 'URL',        value: 'url'},
      { text: 'Benutzer',   value: 'user' },
      { text: 'Passwort',   value: 'password' },
      { text: 'Kunde',      value: 'customer' },
      { text: 'Actions',    value: 'actions', sortable: false }
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
    options: {
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
      });
  },

  methods: {
    getDataFromApi () {
        this.loading = true
        return new Promise((resolve) => {
          const { sortBy, sortDesc, page, itemsPerPage } = this.options

          let items = []
          
          getDbServers().then((result) => {
              this.loading = false;
              if (!result) {
                  resolve({ items: [], total: 0 });
                  return;
              }
              items = result;
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

    async deleteItem (item) {
      if (confirm('Server aus der Überwachung wirklich entfernen?')) {
        let data = {"url": item.url};
        await deleteServer(data);
        this.getDataFromApi().then(data => {
          this.rows = data.items;
          this.totalRows = data.total;
        });
      }
    },

    close () {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      }, 300)
    },

    async save () {
      let data = {
        "url" : this.editedItem.url,
        "user": this.editedItem.user,
        "password": this.editedItem.password,
        "customer": this.editedItem.customer
      }
      await setNewServer(data);
      this.getDataFromApi().then(data => {
        this.rows = data.items;
        this.totalRows = data.total;
      });
      this.close()
    }
  }
}

async function getDbServers() {
    try {
        const result = await fetch('/api/getServerUrls');
        if (result.ok) {
            return await result.json();
        }
        console.error('Failed to fetch servers:', result.statusText);
    } catch (e) {
        console.error('Error fetching servers:', e);
    }
}

async function setNewServer(data) {
    try {
        const result = await fetch('/api/ServerUrl', { 
            method: 'PUT',
            body: JSON.stringify(data),
            headers:{'Content-Type': 'application/json'}
        });
        if (result.ok) {
            const text = await result.text();
            return text ? JSON.parse(text) : {};
        }
        console.error('Failed to set server:', result.statusText);
    } catch (e) {
        console.error('Error setting server:', e);
    }
}

async function deleteServer(data) {
    try {
        const result = await fetch('/api/ServerUrl', { 
            method: 'DELETE',
            body: JSON.stringify(data),
            headers:{'Content-Type': 'application/json'}
        });
        if (result.ok) {
            const text = await result.text();
            return text ? JSON.parse(text) : {};
        }
        console.error('Failed to delete server:', result.statusText);
    } catch (e) {
        console.error('Error deleting server:', e);
    }
}
</script>
<style>
</style>