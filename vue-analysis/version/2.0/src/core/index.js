import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerReadering } from 'core/util/env'

initGlobalAPI(Vue)

// 给Vue原型新增$isServer属性，并定义属性get函数，Vue.prototype.$isServer会调用get（可以实现视图/数据联动）
Object.defineProperty(Vue.prototype, '$isServer', {
	get: isServerReadering
})

// 赋值Vue版本号
Vue.version = '__VERSION__'

export default Vue