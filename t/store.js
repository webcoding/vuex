import ModuleCollection from './module/module-collection';
import { forEachValue, isObject, isPromise } from './util';

// - 不支持 computed 即 getter
// - 不支持 namespace
// - 不支持 plugin
//   - logger
//   - devtool
// - 不支持 严格模式警告

export class Store {
  constructor(options = {}) {
    // store internal state
    this._committing = false
    this._actions = Object.create(null) // {}
    this._actionSubscribers = []
    this._mutations = Object.create(null)
    this._modules = new ModuleCollection(options)
    this._subscribers = []

    // bind commit and dispatch to self
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit (type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    const state = this._modules.root.state

    // 安装根模块
    installModule(this, state, [], this._modules.root)

    resetStoreVM(this, state)
  }

  get state () {
    return this._vm.$$state
  }

  set state (v) {
    console.warn(`use store.replaceState() to explicit replace store state.`);
  }

  // 触发对应 type 的 mutation
  commit (_type, _payload, _options) {
    // check object-style commit
    const {
      type,
      payload,
      options
    } = unifyObjectStyle(_type, _payload, _options);

    const mutation = { type, payload };
    const entry = this._mutations[type];
    if (!entry) {
      return;
    }
    this._withCommit(() => {
      // 遍历触发事件队列
      entry.forEach(function commitIterator (handler) {
        handler(payload);
      })
    })
    this._subscribers.forEach(sub => sub(mutation, this.state))
  }

  dispatch (_type, _payload) {
    // check object-style dispatch
    const {
      type,
      payload
    } = unifyObjectStyle(_type, _payload);

    const action = { type, payload };
    const entry = this._actions[type];
    if (!entry) {
      return;
    }

    try {
      this._actionSubscribers
        .filter(sub => sub.before)
        .forEach(sub => sub.before(action, this.state))
    } catch (e) {
    }

    const result = entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload);

    return result.then(res => {
      try {
        this._actionSubscribers
          .filter(sub => sub.after)
          .forEach(sub => sub.after(action, this.state))
      } catch (e) {
      }
      return res
    })
  }

  subscribe (fn) {
    return genericSubscribe(fn, this._subscribers)
  }

  subscribeAction (fn) {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, this._actionSubscribers)
  }

  replaceState (state) {
    this._withCommit(() => {
      this._vm.$$state = state
    })
  }

  registerModule (path, rawModule, options = {}) {
    if (typeof path === 'string') path = [path]

    this._modules.register(path, rawModule)
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // reset store
    resetStoreVM(this, this.state)
  }

  unregisterModule (path) {
    if (typeof path === 'string') path = [path]

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      delete parentState[path[path.length - 1]];
      // Vue.delete(parentState, path[path.length - 1])
    })
    resetStore(this)
  }

  hotUpdate (newOptions) {
    this._modules.update(newOptions)
    resetStore(this, true)
  }

  _withCommit (fn) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

function genericSubscribe (fn, subs) {
  if (subs.indexOf(fn) < 0) {
    subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

function resetStore (store, hot) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset vm
  resetStoreVM(store, state, hot)
}

function resetStoreVM (store, state, hot) {
  store._vm = {
    $$state: state,
    // computed, // 这里利用 Vue 才支持，否则暂不支持
  };
}

function installModule(store, rootState, path, module, hot) {
  const isRoot = !path.length;

  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      parentState[moduleName] = module.state;
      // Vue.set(parentState, moduleName, module.state)
    })
  }

  // ['account'] -> account/
  const local = module.context = makeLocalContext(store, path)

  // 注册mutation事件队列
  module.forEachMutation((mutation, key) => {
    registerMutation(store, key, mutation, local)
  })

  module.forEachAction((action, key) => {
    const type = key;
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

/**
 * make localized dispatch, commit, and state
 */
function makeLocalContext (store, path) {
  const local = {
    dispatch: store.dispatch,
    commit: store.commit,
  }

  Object.defineProperties(local, {
    // getters: {
    //   get() {return store.getters}
    // },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

function registerMutation (store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler (payload) {
    handler.call(store, local.state, payload)
    // 这里修改数据时，回调 setData，改变页面数据
    store.$callback = function (fn){
      if (typeof fn === 'function') {
        fn(JSON.parse(JSON.stringify(local.state || null)));
      }
    }
  })
}

function registerAction (store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = [])
  entry.push(function wrappedActionHandler (payload, cb) {
    let res = handler.call(store, {
      dispatch: local.dispatch,
      commit: local.commit,
      state: local.state,
      rootState: store.state
    }, payload, cb)
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    return res
  })
}

function getNestedState (state, path) {
  return path.length
    ? path.reduce((state, key) => state[key], state)
    : state
}

function unifyObjectStyle (type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  return { type, payload, options }
}

export function install (xmini) {
  const mixins = {
    $store: that.$store,
  };

  // xmini.addMixin('app', mixins);
  xmini.addMixin('page', mixins);
  xmini.addMixin('component', mixins);
}
