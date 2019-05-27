import { forEachValue } from '../util';

// 传入的参数rawModule就是对象
// {
//   state,
//   mutations,
//   actions,
// }
export default class Module {
  constructor(rawModule, runtime) {
    this.runtime = runtime;
    this._children = Object.create(null);
    this._rawModule = rawModule;

    const rawState = rawModule.state;

    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {};
  }

  // get namespaced() {
  //   return !!this._rawModule.namespaced;
  // }

  addChild(key, module) {
    this._children[key] = module;
  }

  removeChild(key) {
    delete this._children[key];
  }

  getChild(key) {
    return this._children[key];
  }

  update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;

    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    // if (rawModule.getters) {
    //   this._rawModule.getters = rawModule.getters;
    // }
  }

  forEachChild(fn) {
    forEachValue(this._children, fn);
  }

  // forEachGetter(fn) {
  //   if (this._rawModule.getters) {
  //     forEachValue(this._rawModule.getters, fn)
  //   }
  // }

  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}

// Object.create(null);
// https://stackoverflow.com/questions/15518328/creating-js-object-with-object-createnull
