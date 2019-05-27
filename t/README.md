# 小程序支持 store(使用 vuex)

支持小程序使用状态管理模式

- 暂不支持 computed 即 getter
- 暂不支持 namespace
- 暂不支持 plugin
  - logger
  - devtool
- 不支持严格模式

参考：

- https://github.com/vuejs/vuex
- https://github.com/tinajs/tinax

State

```js
// 支持三种格式书写
data: {
  ...mapState([
    'user',
  ])
  ...mapState({
    countAlias: 'count',
    // 箭头函数可使代码更简练
    count: state => state.count,
    userInfo: state => state.user.userInfo,
    // 为了能够使用 `this` 获取局部状态，必须使用常规函数 TODO: 待定
    countPlusLocalState (state) {
      return state.count + this.localCount
    },
  }),
}
```

Getter

```js
// 可以认为是 store 的计算属性。就像计算属性一样，getter 的返回值会根据它的依赖被缓存起来，
// 且只有当它的依赖值发生了改变才会被重新计算。
getters: {
  add(state, getters, rootState) {
    return state.count + rootState.count
  }
}
```

Mutation

```js
mutations: {
  add(state, payload) {
    state.count += payload.amount
  },
}

// 三种格式，由 unifyObjectStyle 统一处理
store.commit('add', 10)

// 标准格式
store.commit('add', {
  amount: 10
})

store.commit({
  type: 'add',
  amount: 10
})
```

Action

```js
actions: {
  // checkout(context, payload, cb) {}
  checkout({ commit, state }, products) {
    commit(types.CHECKOUT_REQUEST)

    api.buyProducts(
      products,
      // 成功操作
      () => commit(types.CHECKOUT_SUCCESS),
      // 失败操作
      () => commit(types.CHECKOUT_FAILURE, savedCartItems)
    )
  },
}

// 三种格式，由 unifyObjectStyle 统一处理
// 以载荷形式分发
store.dispatch('incrementAsync', {
  amount: 10
})

// 以对象形式分发
store.dispatch({
  type: 'incrementAsync',
  amount: 10
})
```

参考资料

- https://vuex.vuejs.org/zh/guide/mutations.html
- https://github.com/dwqs/blog/issues/58
- https://blog.kaolafed.com/2017/05/23/Vuex%20%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/
- https://github.com/answershuto/learnVue/blob/master/docs/Vuex%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90.MarkDown
