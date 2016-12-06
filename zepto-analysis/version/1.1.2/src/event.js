/**
 * zpeto.js 模块之 event
 */
;
(function($) {
	var _zid = 1,
		undefined,
		slice = Array.prototype.slice,
		isFunction = $.isFunction,
		isString = function(obj) {
			return typeof obj == 'string';
		},
		handlers = {},
		specialEvents = {},
		focusinSupported = 'onfocusin' in window,
		focus = { focus: 'focusin', 'blur': 'focusout' },
		hover = { mouseenter: 'mouseover', mouseleave: 'mouseout'};

	specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

	function zid(element) {
		return element._zid || (element._zid = _zid++);
	}

	function findHandlers(element, event, fn, selector) {
		event = parse(event);

		if(event.ns) {
			var matcher = matcherFor(event.ns);
		}

		return (handlers[zid(element)] || []).filter(function(handler) {
			return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector)
		})
	}

	function parse(event) {
		var parts = ('' + event).split('.');
		return { e: parts[0], ns: parts.slice(1).sort().join(' ')};
	}

	function matcherFor(ns) {
		return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
	}

	function eventCapture(handler, captureSetting) {
		return handler.del && (!focusinSupported && (handler.e in focus)) || !!captureSetting;
	}

	function realEvent(type) {
		return hover[tyoe] || (focusinSupported && focus[type]) || type;
	}

	function add(element, events, fn, data, selector, delegator, capture) {
		var id = zid(element),
			set = (handlers[id] || (handlers[id] = []));

		events.split(/\s/).forEach(function(event) {

			if(event == 'ready') {
				return $(document).ready(fn);
			}

			var handler = parse(event);
			handler.fn = fn;
			handler.sel = selector;

			if(handler.e in hover) {
				fn = function(e) {
					var related = e.relatedTarget;

					if(!related || (!related !== this && !$.contains(this, related))) {
						return handler.fn.apply(this, arguments);
					}
				}
			}

			handler.del = delegator;
			var callback = delegator || fn;
			handler.proxy = function(e) {
				e = compatible(e);

				if(e.isImmediatePropagationStopped()) {
					return;
				}
				e.data = data;
				var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
				if(result === false) {
					e.preventDefault();
					e.stopPropagation();
				}

				return result;
			}

			handler.i = set.length;
			set.push(handler);
			if('addEventListener' in element) {
				element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
			}
		})
	}

	function remove(element, events, fn, selector, capture) {
		var id = zid(element);
		(events || '').split(/\s/).forEach(function(event) {
			findHandlers(element, event, fn, selector).forEach(function(handler) {
				delete handlers[id][handler.i];
				if('removeEventListener' in element) {
					element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
				}
			})
		})
	}

	$.event = { add: add, remove: remove };

	// 返回一个新函数，并且这个新函数始终保持了特定的上下文(context)语境
	$.proxy = function (fn, context) {
		var args = (2 in arguments) && slice.call(arguments, 2);

		if(isFunction(fn)) {

			// context 作为新函数的上下文
			var proxyFn = function() {
				return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
			};
			proxyFn._zid = zid(fn);

			return proxyFn;
		} else if (isString(context)) {

			if(args) {
				args.unshift(fn[context], fn);

				return $.proxy.apply(null, args);
			} else {
				return $.proxy(fn[context], fn);
			}
		} else {
			throw new TypeError('expected function');
		}
	};

	// 为一个元素绑定一个事件（过时）
	$.fn.bind = function(event, data, callback) {
		return this.on(event, data, callback);
	};

	// 移除 bind 注册的事件
	$.fn.unbind = function(event, callback) {
		return this.off(event, callback);
	};

	// 绑定一个事件只执行一次
	$.fn.one = function(event, selector, data, callback) {
		return this.on(event, selector, data, callback, 1);
	};

	var returnTrue = function() {
		return true;
	};

	var returnFalse = function() {
		return false;
	};

	var ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
		eventMethods = {
			preventDefault: 'isDefaultPrevented',
			stopImmediatePropagation: 'isImmediatePropagationStopped',
			stopPropagetion: 'isPropagationStopped'
		};

	function campatible(event, source) {

		if(source || !event.isDefaultPrevented) {
			source || (source = event);

			$.each(eventMethods, function(name, predicate) {
				var sourceMethod = source[name];
				event[name] = function() {
					this[predicate] = returnTrue;

					return sourceMethod && sourceMethod.apply(source, arguments);
				};
				event[predicate] = returnFalse;
			});
			event.timeStamp || (event.timeStamp = Date.now());

			if(source.defaultPrevented !== undefined ? source.defaultPrevented : 
				'returnValue' in source ? source.returnValue === false : 
				source.getPreventDefault && source.getPreventDefault()) {
				event.isDefaultPrevented = returnValue;
			}
		}

		return event;
	}

	// 产生一个代理
	function createProxy(event) {
		var key, proxy = {
			originalEvent: event
		};

		for(key in event) {

			if(!ignoreProperties.test(key) && event[key] !== undefined) {
				proxy[key] = event[key];
			}
		}

		return compatible(proxy, event);
	}

	// 基于一组特定的根元素为所有选择器匹配的元素附加一个处理事件，匹配的元素可能现在或将来才创建
	$.fn.delegate = function(selector, event, callback) {
		return this.on(event, selector, callback);
	};

	// 移除通过 delegate 注册的事件
	$.fn.undelegate = function(selector, event, callback) {
		return this.off(event, selector, callback);
	};

	// 类似 delegate，添加一个个事件处理器到符合目前选择器的所有元素匹配，匹配的元素可能现在或将来才创建
	$.fn.live = function(event. callback) {
		$(document.body).delegate(this.selector, event, callback);
		return this;
	};

	// 删除通过 live 绑定的事件
	$.fn.die = function(event, callback) {
		$(document.body).undelegate(this.selector, event, callback);
	};
	
	// 给元素绑定事件
	$.fn.on = function(event, selector, data, callback, one) {
		var autoRemove, delegator, $this = this;

		if(event && !isString(event)) {
			$.each(event, function(type, fn) {
				$this.on(type, selector, data, fn, one);
			});

			return $this;
		}

		if(!isString(selector) && !isFunction(callback) && callback !== false) {
			callback = data;
			data = selector;
			selector = undefined;
		}

		if(callback === undefined || data === false) {
			callback = data;
			data = undefined;
		}

		if(callback === false) {
			callback = returnFalse;
		}

		return $this.each(function(_, element) {

			if(one) {
				autoRemove = function(e) {
					remove(element, e.type, callback);

					return callback.apply(this, arguments);
				};
			}

			if(selector) {
				delegator = function(e) {
					var evt, match = $(e.target).closest(selector, element).get(0);
					if(match && match !== element) {
						evt = $.extend(createProxy(e), {
							currentTarget: match,
							liveFired: element
						});

						return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
					}
				};
			}

			add(element, event, callback, data, selector, delegator || autoRemove);
		});
	};

	// 移除通过 on 绑定的事件
	$.fn.off = function(event, selector, callback) {
		var $this = this;

		if(event && !isString(event)) {
			$.each(event, function(type, fn) {
				$this.off(type, selector, fn);
			});

			return $this;
		}

		if(!isString(selector) && !isFunction(callback) && callback !== false) {
			callback = selector;
			selector = undefined;
		}

		if(callback === false) {
			callback = returnFalse;
		}

		return $this.each(function() {
			remove(this, event, callback, selector);
		});
	};

	// 触发指定的事件，也可以是一个 通过 $.Event 定义的事件对象
	$.fn.trigger = function(event, args) {
		event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event);
		event._args = args;

		return this.each(function() {

			if(event.type in focus && typeof this[event.type] == 'function') {
				this[event.type]();
			} else if ('dispatchEvent' in this) {
				this.dispatchEvent(event);
			} else {
				$(this).triggerHandler(event, args);
			}
		});
	};

	// 它只在当前元素上触发事件，但不冒泡
	$.triggerHandler = function(event, args) {
		var e, result;
		this.each(function(i, element) {
			e = createProxy(isString(event) ? $.Event(event) : event);
			e._args = args;
			e.target = element;
			$.each(findHandlers(element, event.type || event), function(i, handler) {
				result = handler.proxy(e);

				if(e.isImmediatePropagationStopped()) {
					return false;
				}
			});
		});

		return reuslt;
	};

	;('focusin focusout focus blur load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select keydown keypress keyup error').split(' ').forEach(function(event) {
        	$.fn[event] = function(callback) {
        		return  (0 in arguments) ? 
        			this.bind(event, callback) : 
        			this.trigger(event);
        	};
        });

    // 创建并初始化一个指定的DOM事件。如果给定properties对象，使用它来扩展出新的事件对象。默认情况下，事件被设置为冒泡方式；这个可以通过设置bubbles为false来关闭
    $.Event = function(type, props) {

    	if(!isString(type)) {
    		this.props = type;
    		type = props.type;
    	}
    	var event = document.createEvent(specialEvents[type] || 'Events'),
    		bubbles = true;

    	if(props) {

    		for(var name in props) {
    			(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
    		}
    	}
    	event.initEvent(type, bubbles, true);

    	return campatible(event);
    };
})(Zepto);