/**
 * zepto 模块之 data 存储对象
 */
(function($) {
	var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
		exp = $.expando = 'Zepto' + (+new Date()), emptyArray = [];

	/**
	 * 获取 data 数据
	 */
	function getData(node, name) {
		var id = node(exp), store = id && data[id];

		if(name === undefined) {
			return store || setData(node);
		} else {

			if(store) {

				if(name in store) {
					return store[name];
				}
				var camelName = camelize(name);

				if(camelName in store) {
					return store[camelName];
				}
			}

			return dataAttr.call($(node), name);
		}
	}

	// 设置 data
	function setData(node, name, value) {
		var id = node[exp] || (node[exp] = ++$.uuid),
			store = data[id] || (data[id] = attributeData(node));

		if(name !== undefined) {
			store[camelize(name)] = value;
		}

		return store;
	}

	// 读取来自节点 data-* 属性内容
	function attributeData(node) {
		var store = {};
		$.each(node.attributes || emptyArray, function(i, attr) {

			if(attr.name.indexOf('data-') == 0) {
				store[camelize(attr.name.replace('data-', ''))] = $.zepto.deserializeValue(attr.value);
			}
		});

		return store;
	}

	// data 方法
	$.fn.data = function(name, value) {
		return value === undefined ? 
			// set multiple values via object
			$.isPlainObject(name) ? 
				this.each(function(i, node) {
					$.each(name, function(key, value) {
						setData(node, key, value);
					});
				}) : (0 in this ? getData(this[0], name) : undefined) : 
				this.each(function() {
					setData(this, name, value);
				});
	};

	$.data = function(elem, name, value) {
		return $(elem).data(name, value);
	};

	$.hasData = function(elem) {
		var id = elem[exp], store = id && data[id];

		return store ? !$.isEmptyObject(store) : false;
	};

	// 移除 data 内容
	$.fn.removeData = function(names) {

		if(typeof names == 'string') {
			names = names.split(/\s+/);
		}

		return this.each(function() {
			var id = this[exp], store = id && data[id];

			if(store) {
				$.each(names || store, function(key) {
					delete store[names ? camelize(this) : key];
				})
			}
		});
	};

	// 遍历定义方法
	['remove', 'empty'].forEach(function(methodName) {
		var origFn = $.fn[methodName];
		$.fn[methodName] = function() {
			var elemtns = this.find('*');

			if(methodName === 'remove') {
				elements = elements.add(this);
			}

			elements.removeData();

			return origFn.call(this);
		};
	});
})(Zepto);