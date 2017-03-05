import config from '../config'
import { perf } from '../util/perf'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initLifecycle , callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatCompinentName } from '../util/index'

let uid = 0

export function initMixin(Vue: Class<Component>) {
	Vue.prototype._init = function(options?: Object) {

		/* istanbul ignore if */
		if (process.env.NODE_ENV !== 'production' && config.performance && perf) {
		    perf.mark('init')
		}
		const vm: Component = this
		vm._uid = uid++;
		vm._isVue = true

		if(options && options._isComponent) {
			initInternalComponent(vm, options);
		} else {
			vm.$options = mergeOptions(
				resolveConstructorOptions(vm.constructor),
				options || {},
				vm
			)
		}

		/* istanbul ignore else */
	    if (process.env.NODE_ENV !== 'production') {
	      	initProxy(vm)
	    } else {
	      	vm._renderProxy = vm
	    }
	    vm._self = vm
	    initLifecycle(vm)
	    initEvents(vm)
	    initRender(vm)
	    callHook(vm, 'beforeCreate')
	    initState(vm)
	    callHook(vm, 'created')

	    /* istanbul ignore if */
	    if (process.env.NODE_ENV !== 'production' && config.performance && perf) {
	      	vm._name = formatComponentName(vm, false)
	      	perf.mark('init end')
	      	perf.measure(`${vm._name} init`, 'init', 'init end')
	    }

	    if (vm.$options.el) {
	      	vm.$mount(vm.$options.el)
	    }
	}
}

// 初始化内部组件
function initInternalComponent(vm: Component, options: InternalComponentOptions) {
	const opts = vm.$options = Object.create(vm.constructor.options)
	opts.parent = options.parent
	opts.propsData = options.propsData
	opts._parentVnode = options._parentVnode
	opts._parentListeners = options._parentListeners
	opts._renderChildren = options._renderChildren
	opts._componentTag = options._componentTag
	opts._parentElm = options._parentElm
	opts._refElm = options._refElm
	if(options.render) {
		opts.render = options.render
		opts.staticRenderFns = options.staticRenderFns
	}
}

// 解析构造函数选项
export function resolveConstructorOptions(Ctor: Vue<Component>) {
	let options = Ctor.options
	if(Ctor.super) {
		const superOptions = resolveConstructorOptions(Ctor.super)
		const cachedSuperOptions = Ctor.superOptions
		if(superOptions !== cachedSuperOptions) {
			Ctor.superOptions = superOptions
			const modifiedOptions = resolveConstructorOptions(Ctor)
			if(modifiedOptions) {
				extend(Ctor.extendOptions, modifiedOptions)
			}

			options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
			if(options.name) {
				options.components[options.name] = Ctor
			}
		}
	}

	return options
}

function resolveModifiedOptions(Ctor: Vue<Component>): ?Object {
	let modified
	const latest = Ctor.options
	const sealed = Ctor.sealedOptions
	for(const key in latest) {

		if(latest[key] !== sealed[key]) {
			if(!modified) modified = {}
				modified[key] = dedupe(latest[key], sealed[key])
		}
	}

	return modified
}

function dedupe(latest, sealed) {
	
	if(Array.isArray(latest)) {
		const res = []
		sealed = Array.isArray(sealed) ? sealed : [sealed]

		for(let i = 0; i < latest.length; i++) {

			if(sealed.indexOf(latest[i]) < 0) {
				res.push(latest[i]);
			}
		}

		return res
	} else {
		return latest
	}
}