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

	};






























})(Zepto);