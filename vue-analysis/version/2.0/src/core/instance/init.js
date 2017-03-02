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

function initInternalComponent(vm: Component, options: InternalComponentOptions) {

}

export function resolveConstructorOptions(Ctor: Vue<Component>) {

}

function resolveModifiedOptions(Ctor: Vue<Component>): ?Object {

}

function dedupe(latest, sealed) {
	
}