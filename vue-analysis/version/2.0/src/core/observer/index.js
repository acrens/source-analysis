export function observe (value: any, asRootData: ?boolean): Observer | void {
	if (!isObject(value)) {
		return
	}

	let obj: Observer | void
	if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
		ob = value.__ob__
	} else if (observerState.shouldConvert && !isServerRendering() && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
		ob = new Observer(value)
	}

	if (asRootData && ob) {
		ob.vmCount++
	}

	return ob
}

/**
 * 在一个对象上定义一个reactive属性
 */
export function defineReactive(
	obj: Object,
	key: string,
	val: any,
	customsETTER?: Function
) {
	const dep = new Dep()
	const property = Object.getOwnPropertyDescriptor(obj, key)	// 获取 obj 对象里面 key 对应的属性相关信息，如：value、writable等

	// configurable 表示对应的属性可否被修改或者被删除
	if (property && property.configurable === false) {
		return
	}
	const getter = property && property.get
	const setter = property && property.set

	let childOb = observe(val)
	Object.defineProperty(obj, key, {
		enumerable: true,	// 表示该属性是否可在该对象枚举时被显示
		configurable: true,	// 表示对应的属性可否被修改或者被删除
		get: function reactiveGetter () {
			const value = getter ? getter.call(obj) : val
			if (Deop.target) {
				dep.depend()
				if (childOb) {
					childOb.dep.depend()
				}

				if (Array.isArray(value)) {
					dependArray(value)
				}
			}

			return value
		},
		set: function reactiveSetter (newVal) {
			const value = getter ? getter.call(obj) : val
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return
			}

			if (process.env.NODE_ENV !== 'production' && customSetter) {
				customSetter()
			}

			if (setter) {
				setter.call(obj, newVal)
			} else {
				val = newVal
			}
			childOb = observe(newVal)
			dep.notify()
		}
	})
}

function dependArray (value: Array<any>) {
	for (let e, i = 0, l = value.length; i < l; i++) {
		e = value[i]
		e && e.__ob__ && e.__ob__.dep.depend()
		if (Array.isArray(e)) {
			dependArray(e)
		}
	}
}