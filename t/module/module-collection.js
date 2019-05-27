import Module from './module';
import { forEachValue } from '../util';

export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }

  // example:
  // -> ['account', 'user'] 获取到对应的 module
  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root);
  }

  // ['account'] -> account/
  // getNamespace (path) {
  //   let module = this.root
  //   return path.reduce((namespace, key) => {
  //     module = module.getChild(key)
  //     return namespace + (module.namespaced ? key + '/' : '')
  //   }, '')
  // }

  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }

  register(path, rawModule, runtime = true) {

    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) {
      this.root = newModule
    } else {
      // arr.slice(?start, ?end)
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // register nested modules
    // key: errorLog, user...
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  unregister (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    if (!parent.getChild(key).runtime) return

    parent.removeChild(key)
  }
}


function update(path, targetModule, newModule) {
  // update target module
  targetModule.update(newModule);

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) return;
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

// function assertRawModule (path, rawModule) {}

// function makeAssertionMessage (path, key, type, value, expected) {}
