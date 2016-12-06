/**
 * zpeto.js 模块之 zepto
 */
var Zepto = (function() {
	var undefined, key, $, classList, emptyArray = [],
		concat = emptyArray.concat,
		filter = emptyArray.filter,
		slice = emptyArray.slice,
		document = window.document,
		elementDisplay = {},
		classCache = {},
		cssNumber = { 
			'column-count': 1,
			'columns': 1,
			'font-weight': 1,
			'line-height': 1,
			'opacity': 1,
			'z-index': 1,
			'zoom': 1
		},
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
		rootNodeRE = /^(?:body|html)$/i,
		capitalRE = /([A-Z])/g,
		methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
		adjacencyOperators = ['after', 'prepend', 'before', 'append'],
		table = document.createElement('table'),
		tableRow = document.createElement('tr'),
		containers = {
			'tr': document.createElement('tbody'),
			'tbody': table,
			'thead': table,
			'tfoot': table,
			'td': tableRow,
			'th': tableRow,
			'*': document.createElement('div')
		},
		readyRE = /complete|loaded|interactive/,
		simpleSelectorRE = /^[\w-]*$/,
		class2type = {},
		toString = class2type.toString,
		zepto = {},
		camelize, uniq,
		tempParent = document.createElement('div'),
		propMap = {
			'tabindex': 'tabIndex',
			'readonly': 'readOnly',
			'for': 'htmlFor',
			'class': 'className',
			'maxlength': 'maxLength',
			'cellspacing': 'cellSpacing',
			'cellpadding': 'cellPadding',
			'rowspan': 'rowSpan',
			'colspan': 'colSpan',
			'usemap': 'useMap',
			'frameborder': 'frameBorder',
			'contenteditable': 'contentEditable'
		},
		isArray = Array.isArray || function(object) {
			return object instanceof Array;
		};

		// TODO: 
		zepto.matches = function(element, selector) {

			if(!selector || !element || element.nodeType !== 1) {
				return false;
			}

			var matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector;
			if(matchesSelector) {
				return matchesSelector.call(element, selector);
			}

			var match, parent = element.parentNode, temp = !parent;
			if(temp) {
				(parent = tempParent).appendChild(element);
			}
			match = ~zepto.qsa(parent, selector).indexOf(element);
			temp && tempParent.removeChild(element);

			return match;
		};

		// 返回数据类型（字符串）
		function type(obj) {
			return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object';
		}

		// 结合 type 函数判断是否为函数
		function isFunction(value) {
			return type(value) == 'function';
		}

		// 判断是否为 window 对象
		function isWindow(obj) {
			return obj != null && obj == obj.window;
		}

		// 判断是否为 document 对象
		function isDocument(obj) {
			return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
		}

		// 判断是否为对象
		function isObject(obj) {
			return type(obj) == 'object';
		}

		// 检测对象是否为纯粹的对象，{} 或者 new Object()
		function isPlainObject(obj) {
			return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
		}

		// 判断是否为数组
		function likeArray(obj) {
			var length = !!obj && 'length' in obj && obj.length,
				type = $.type(obj);

			return 'function' != type && !isWindow(obj) && ('array' == type || length === 0) || (typeof length == 'number' && length > 0 && (length - 1) in obj);
		}

		function compact(array) {
			return filter.call(array, function(item) {
				return item != null;
			});
		}

		function flatten(array) {
			return array.length > 0 ? $.fn.concat.apply([], array) : array;
		}

		// 转化为大写字母
		camelize = function(str) {
			return str.replace(/-+(.)?/g, function(match, chr) {
				return chr ? chr.toUpperCase() : ''
			});
		}

		// 转换为小写字母
		function dasherize(str) {
			return str.replace(/::/g, '/')
				.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
                .replace(/([a-z\d])([A-Z])/g, '$1_$2')
                .replace(/_/g, '-')
                .toLowerCase()
		}

		uniq = function(array) {
			return filter.call(array, function(item, idx) {
				return array.indexOf(item) == idx
			});
		}

		// class 正则匹配
		function classRE(name) {
			return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
		}

		// 返回像素值
		function maybeAddPx(name, value) {
			return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value;
		}

		function defaultDisplay(nodeName) {
			var element, display;

			if(!elementDisplay[nodeName]) {
				element = document.createElement(nodeName);
				document.body.appendChild(element);
				display = getComputedStyle(element, '').getPropertyValue('display');
				element.parentNode.removeChild(element);
				display == 'node' && (display = 'block');
				elementDisplay[nodeName] = display;
			}

			return elementDisplay[nodeName];
		}

		function children(element) {
			return 'children' in element ? slice.call(element.children) : $.map(element.childNodes, function(node) {
				if(node.nodeType == 1) return node;
			});
		}

		function Z(dom, selector) {
			var i, len = dom ? dom.length : 0;
			for(i = 0; i < len; i++) {
				this[i] = dom[i];
			}
			this.length = len;
			this.selector = selector || '';
		}

		zepto.fragment = function(html, name, properties) {
			var dom, nodes, contaniner;

			if(singleTagRE.test(html)) {
				dom = $(document.createElement(RegExp.$1));
			}

			if(!dom) {
				if(html.replace) html = html.replace(tagExpanderRE, '<$1><$2>');
				if(name === undefined) name = fragmentRE.test(html) && RexExp.$1;
				if(!(name in containers)) name = '*';

				containers = containers[name];
				container.innerHTML = '' + html;
				dom = $.each(slice.call(container.childNodes), function() {
					container.removeChild(this);
				});
			}

			if(isPlainObject(properties)) {
				nodes = $(dom);
				$.each(properties, function(key, value) {
					if(methodAttributes.indexOf(key) > -1) {
						nodes[key](value);
					} else {
						nodes.attr(key, value);
					}
				})
			}

			return dom;
		}

		zepto.Z = function(dom, selector) {
			return new Z(dom, selector);
		}

		zepto.isZ = function(object) {
			return object instanceof zepto.Z;
		}

		zepto.init = function(selector, context) {
			var dom;

			if(!selector) {
				return zepto.Z();
			} else if(typeof selector == 'string') {
				selector = selector.trim();

				if(selector[0] == '<' && fragmentRE.test(selector)) {
					dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
				} else if(context !== undefined) {
					return $(context).find(selector);
				} else {
					dom = zepto.qsa(document, selector);
				}
			} else if(isFunction(selector)) {
				return $(document).ready(selector);
			} else if(zepto.Z(selector)) {
				return selector;
			} else {

				if(isArray(selector)) {
					dom = compact(selector);
				} else if(isObject(selector)) {
					dom = [selector], selector = null;
				} else if(fragmentRE.test(selector)) {
					dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
				} else if(context == undefined) {
					return $(context).find(selector);
				} else {
					dom = zepto.qsa(document, selector);
				}
			}

			return zepto.Z(dom, selector);
		}

		// $ 定义
		$ = function(selector, context) {
			return zepto.init(selector, context);
		};

		// 扩展方法
		function extend(target, source, deep) {

			for(key in source) {

				if(deep && (isPlainObject(source[key]) || isArray(source[key]))) {

					if(isPlainObject(source[key]) && !isPlainObject(target[key])) {
						target[key] = {};
					}

					if(isArray(source[key]) && !isArray(target[key])) {
						target[key] = [];
					}

					extend(target[key], source[key], deep);
				} else if(source[key] !== undefined) {
					target[key] = source[key];
				}
			}
		}

		// 复制及覆盖不为 undefined 值得属性
		$.extend = function(target) {
			var deep, args = slice.call(arguments, 1);
			if(typeof target == 'boolean') {
				deep = target;
				target = args.shift();
			}
			args.forEach(function(arg){
				extend(target, arg, deep);
			});

			return target;
		};

		zepto.qsa = function(element, selector) {
			var found,
				maybeID = selector[0] == '#',
				maybeClass = !maybeID && selector[0] == '.',
				nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
				isSimple = simpleSelectorRE.test(nameOnly);

			return (element.getElementById && isSimple && maybeID) ? 
				((found = element.getElementById(nameOnly)) ? [found] : []) : 
				(element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] : 
				slice.call(
					isSimple && !maybeID && element.getElementsByClassName ? 
					maybeClass ? element.getElementsByClassName(nameOnly) : 
					element.getElementsByTagName(selector) : 
					element.querysELECTORaLL(selector)
				)
		};

		function filtered(nodes, selector) {
			return selector == null ? $(nodes) : $(nodes).filter(selector);
		}

		// 检查父节点是否包含给定的dom节点，如果两者是相同的节点，则返回 false
		$.contains = document.documentElement.contains ? 
			function(parent, node) {
				return parent !== node && parent.contains(node)
			} : 
			function(parent, node) {
				while(node && (node = node.parentNode)) {
					if(node == parent) return true;
				}

				return false;
			}

		function funcArg(context, arg, idx, payload) {
			return isFunction(arg) ? arg.call(context, idx, payload) : arg;
		}

		function setAttribute(node, name, value) {
			value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
		}

		function className(node, value) {
			var klass = node.className || '',
				svg = klass && klass.baseVal !== undefined;

			if(value === undefined) {
				return svg ? klass.baseVal : klass;
			}

			svg ? (klass.baseVal = value) : (node.className = value);
		}

		function deserializeValue(value) {
			try {
				return value ? 
					value == 'true' || 
					(value == 'false' ? false : 
						value == 'null' ? null : 
						+value + '' == value ? +value : 
						/^[\[\{]/.test(value) ? $.parseJSON(value) : 
							value) : value;
			} catch(e) {
				return value;
			}
		}

		$.type = type;	// 返回数据类型
		$.isFunction = isFunction;	// 判断是否为函数
		$.isWindow = isWindow;	// 判断对象那个是否为 wndow
		$.isArray = isArray;	// 判断元素是否为数组
		$.isPlainObject = isPlainObject;

		// 判断对象是否为空
		$.isEmptyObject = function(obj) {
			var name;
			for(name in obj) return false;	// 空对象没有任何可遍历属性
			return true;
		};

		// 判断该值为有限数值或一个字符串表示的数字
		$.isNumeric = function(val) {
			var num = Number(val),
				type = typeof val;

			return val != null && type != 'boolean' && (type !=' string' || val.length) && !isNaN(num) && isFinite(num) || false;
		};

		// 返回数组中指定元素的索引值
		$.inArray = function(elem, array, i) {
			return emptyArray.indexOf.call(array, elem, i);
		};

		// 纠正为驼峰命名
		$.camelCase = camelize;

		// 去除字符串前后空串
		$.trim = function(str) {
			return str == null ? '' : String.prototype.trim.call(str);
		};

		// 插件参数
		$.uuid = 0;
		$.support = {};
		$.expr = {};
		$.noop = function() {};

		// 遍历集合，返回回调函数结果（null、undefined 将被过滤）
		$.map = function(elements, callback) {
			var value, values = [], i, key;

			if(likeArray(elements)) {

				// element.length 为何不用一个临时变量暂存，而选择每次遍历一个元素重新读取长度
				for(i = 0; i < elements.length; i++) {
					value = callback(elements[i], i);

					if(value != null) values.push(value);
				}
			} else {

				for(key in elements) {
					value = callback(elements[key], key);

					if(value != null) values.push(value);
				}
			}

			return flatten(values);
		};

		// 遍历数组或者对象，回调函数返回 false 时停止遍历
		$.each = function(elements, callback) {
			var i, key;

			if(likeArray(elements)) {

				for(i = 0; i < elements.length; i++) {

					if(callback.call(elements[i], i, elements[i]) === false) return elements;
				}
			} else {

				for(key in elements) {

					if(callback.call(elements[key], key, elements[key]) === false) return elements;
				}
			}

			return elements;
		};

		// 获取一个新数组，数组只包含回调返回为 true 的值
		$.grep = function(elements, callback) {
			return filter.call(elements, callback);
		};

		if(window.JSON) $.parseJSON = JSON.parse;	// 转 JSON 函数暂存
		$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase()
        });

        // Zepto.fn是一个对象，它拥有Zepto对象上所有可用的方法，如 addClass()， attr()，和其它方法。在这个对象添加一个方法，所有的Zepto对象上都能用到该方法
        $.fn = {

        };

        // 删除
        $.fn.detach = $.fn.remove;

        // 定义 width\height 函数
        ['width', 'htight'].forEach(function(dimension) {
        	var dimensionProperty = dimension.replace(/./, function(m) {
        		return m[0].toUpperCase();
        	});

        	$.fn[dimension] = function(value) {
        		var offset, el = this[0];

        		if(value === undefined) {
        			return isWindow(el) ? el['inner' + dimensionProperty] : 
        				isDocument(el) ? el.documentElement['scroll' + dimensionProperty] : 
        				(offset = this.offset()) && offset[dimension];
        		} else {
        			return this.each(function(idx) {
        				el = $(this);
        				el.css(dimension, funcArg(this, value, idx, el[dimension]()));
        			});
        		}

        	};
        });

        function traverseNode(node, fun) {
        	fun(node);
        	for(var i = 0, len = node.childNodes.length; i < len; i++) {
        		traverseNode(node.childNodes[i], fun);
        	}
        }

        // 定义 `after`, `prepend`, `before`, `append`,`insertAfter`, `insertBefore`, `appendTo`, and `prependTo` 函数
        adjacencyOperators.forEach(function(operator, operatorIndex) {
        	var inside = operatorIndex % 2;

        	$.fn[operator] = function() {
        		var argType, nodes = $.map(arguments, function(arg) {
        			var arr = [];
        			argType = type(arg);
        			if(argType == 'array') {
        				arg.forEach(function(el) {
        					if(el.nodeType !== undefined) {
        						return arr.push(el);
        					} else if ($.zepto.isZ(el)) {
        						return arr = arr.concat(el.get());
        					}

        					return arr;
        				});
        			}

        			return argType == 'object' || arg == null ? arg : zepto.fragment(arg);
        		}),
        		parent, copyByClone = this.length > 1;

        		if(nodes.length < 1) return this;

        		return this.each(function(_, target) {
        			parent = inside ? target : target.parentNode;
        			target = operatorIndex == 0 ? target.nextSibling : 
        				operatorIndex == 1 ? target.firstChild : 
        				operatorIndex == 2 ? target : 
        				null;

        			var parentInDocument = $.contains(document.documentElement, parent);
        			nodes.forEach(function(node) {

        				if(copyByClone) {
        					node = node.cloneNode(true);
        				} else if(!parent) {
        					return $(node).remove();
        				}

        				parent.insertBefore(node, target);
        				if(parentInDocument) traverseNode(node, function(el) {

        					if(el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && 
        						(!el.type || el.type === 'text/javascript') && !el.src) {
        						var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
        						target['eval'].call(target, el.innerHTML);
        					}
        				});
        			});
        		});
        	};

        	$.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
        		$(html)[operator](this);
        		return this;
        	}
        });

        zepto.Z.prototype = Z.prototype = $.fn;
        zepto.uniq = uniq;
        zepto.deserializeValue = deserializeValue;
        $.zepto = zepto;

        return  $;
})();

// 开放全局变量
window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto);