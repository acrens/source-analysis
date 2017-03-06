import Dep from '../observer/dep'
import Watcher from '../observer/watcher'

import {
	set,
	del,
	observe,
	defineReactive,
	observerState
} from '../observer/index'

import {
	warn,
	hasOwn,
	isResugerved,
	isPlainObject,
	bind,
	validateProp,
	noop
} from '../util/index'

const sharedPropertyDefinition = {
	enumerable: true,
	configurable: true,
	get: noop,
	set: noop
}

export function proxy(target: Object, sourceKey: string, key: string) {
	sharedPropertyDefinition.get = function proxyGetter() {
		return this[sourceKey][key]
	}

	sharedPropertyDefinition.set = function proxySetter(val) {
		this[sourceKey][key] = val
	}
	Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState(vm: Component) {
	vm._watchers = []
	const opts = vm.$options
	if(opts.props) initProps(vm, opts.props)
	if(opts.methods) initMethods(vm, opts.methods)
	if(opts.data) {
		initData(vm)
	} else {
		observe(vm._data = {}, true)
	}
	if(opts.computed) initComputed(vm, opts.computed)
	if(opts.watch) initWatch(vm, opts.watch)
}

const isReservedProp = { key: 1, ref: 1, slot: 1}

function initProps(vm: Component, propsOptions: Object) {
	const propsData = vm.$options.propsData || {}
	const props = vm._props = {}
	const keys = vm.$options._propKeys = []
	const isRoot = !vm.$parent

	observerState.shouldConvert = isRoot
	for(const key in propsOptions) {
		keys.push(key)
		const value = validateProp(key, propsOptions, propData, vm)
		if(process.env.NODE_ENV !== 'production') {

			if(isReservedProp[key]) {
				warn(
					`"${key}" is a reserved attribute and cannot be used as component prop.`,
					vm
				)
			}
			defineReactive(props, key, value, () => {

				if(vm.$parent && !observerState.isSettingProps) {
					warn(
			            `Avoid mutating a prop directly since the value will be ` +
			            `overwritten whenever the parent component re-renders. ` +
			            `Instead, use a data or computed property based on the prop's ` +
			            `value. Prop being mutated: "${key}"`,
			            vm
			        )
				}
			})
		} else {
			defineReactive(props, key, value)
		}

		if(!(key in vm)) {
			proxy(vm, `_props`, key)
		}
	}
	observerState.shouldConvert = true
}




