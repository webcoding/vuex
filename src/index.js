import { Store, install } from './store'
import { mapState, mapMutations, mapGetters, mapActions } from './helpers'

/**
 * 暴露的 API，一目了然
 * install 是配合 Vue.use 方法，用于在 Vue 中注册 Vuex，和数据流关系不大
 *
 * http://www.infoq.com/cn/articles/source-code-vuex2
 */
export default {
  Store,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters,
  mapActions
}
