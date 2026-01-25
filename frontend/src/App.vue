<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>AI</span>
        <span class="font-weight-light">AutoServerCheck</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn small v-on:click="switchButton">{{btText}}</v-btn>
    </v-app-bar>
    <router-view></router-view>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      btText: 'admin'
    }
  },
  methods: {
    switchButton(){
      if (this.btText === 'admin') {
        this.$router.push('/asc/admin');
        this.btText = 'Home';
      } else {
        this.$router.push('/asc/');
        this.btText = 'admin'
      }
      
    }
  },
}
</script>
