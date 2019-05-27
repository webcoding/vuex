import { Store, install } from './store'
import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'

export default {
  Store,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters,
  mapActions,
  createNamespacedHelpers
}

// usage:
// const store = new Vuex.Store({
//   state: {
//     count: 0,
//   },
//   getters: {},
//   mutations: {
//     increment (state) {
//       state.count++
//     }
//   },
//   actions: {},
//   modules: {
//     errorLog,
//     app,
//     config,
//     user,
//   },
//   // plugins: [myPlugin],
// });

// store.commit('increment')
// console.log(store.state.count) // -> 1
// or this.$store.state
