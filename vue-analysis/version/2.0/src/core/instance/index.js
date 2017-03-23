import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from 'lifecycle'
import { warn } from '../util/index'

function Vue(options) {

	if(process.env.NODE_ENV !== 'production' && !(this instance Vue)) {
		warn('Vue is a constructor and should be called with the `new` keyword')
	}
	this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
renderMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)

export default Vue