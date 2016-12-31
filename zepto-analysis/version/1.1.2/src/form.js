/**
 * zepto 模块之 form
 */
(function($) {

	// 获取第一个匹配表单数据数组，格式：[{name: name, value: value}] 
	$.fn.serializeArray = function() {
		var name, type, result = [],
			add = function(value) {

				if(value.forEach) {
					return value.forEach(add);
				}
				result.push({
					name: name,
					value: value
				});
			};

		if(this[0]) {
			$.each(this[0].elements, function(_, field) {
				type = field.type, name = field.name;

				// 禁用编辑框、按钮、为被选中单选、多选按钮均忽略值
				if(name && field.nodeName.toLowerCase() != 'fieldset' && 
					!field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' && 
					((type != 'radio' && type != 'checkbox') || field.checked)) {
					add($(field).val());
				}
			});
		}

		return result;
	};

	// 获取表单 & 拼接数据
	$.fn.serialize = function() {
		var result = [];
		this.serializeArray().forEach(function(elm) {
			result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value));
		});

		return result.join('&');
	};

	// 表单提交封装
	$.fn.submit = function(callback) {

		if(0 in arguments) {
			this.bind('submit', callback);
		} else if (this.length) {
			var event = $.Event('submit');
			this.eq(0).trigger(event);

			if(!event.isDefaultPrevented()) {
				this.get(0).submit();
			}
		}

		return this;
	};
})(Zepto);