/**
 * zepto .js 模块之 ajax
 */
(function($) {
	var jsonpID = +new Date(),
		document = window.document,
		key,
		name,
		rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		scriptTypeRE = /^(?:text|application)\/javascript/i,  // javascript
        xmlTypeRE = /^(?:text|application)\/xml/i,  // xml
        jsonType = 'application/json',  // json
        htmlType = 'text/html', // html
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a');

    originAnchor.href = window.location.href; // 暂存当前页面链接元素

    // 触发一个事件，如果被取消，则返回 false
    function triggerAndReturn(context, eventName, data) {
    	var event = $.Event(eventName);
    	$(context).trigger(event, data);

    	return !event.isDefaultPrevented();
    }

    // 触发一个全局的 ajax
    function triggerGlobal(settings, context, eventName, data) {

    	if(settings.global) {
    		return triggerAndReturn(context || document, eventName, data);
    	}
    }

    // 记录 ajax 被激活的数量
    $.active = 0;

    // ajax 开始
    function ajaxStart(settings) {

    	if(settings.global && $.active++ === 0) {
    		triggerGlobal(settings, null, 'ajaxStart');
    	}
    }

    // ajax 停止
    function ajaxStop(settings) {

    	if(settings.global && !(--$.active)) {
    		triggerGlobal(settings, null, 'ajaxStop');
    	}
    }

    // ajax 发送请求之前事件
    function ajaxBeforeSend(xhr, settings) {
    	var context = settings.context;

    	if(settings.beforeSend.call(context, xhr, settings) === false ||
    		triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
    		return false;
    	}

    	triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    }

    // ajax success
    function ajaxSuccess(data, xhr, settings, deferred) {
    	var context = settings.context,
    		status = 'success';
    	settings.success.call(context, data, status, xhr);

    	if(deferred) {
    		deferred.resolveWith(context, [data, status, xhr]);
    	}
    	triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
    	ajaxComplete(status, xhr, settings);
    }

    // ajax error:["timeout", "error", "abort", "parsererror"]
    function ajaxError(error, type, xhr, settings, deferred) {
    	var context = settings.context;
    	settings.error.call(context, xhr, type, error);

    	if(deferred) {
    		deferred.rejectWith(context, [xhr, type, error]);
    	}
    	triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
    	ajaxComplete(type, xhr, settings);
    }

    // ajax 请求完成,status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
    	var context = settings.context;
    	settings.complete.call(context, xhr, status);
    	triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
    	ajaxStop(settings);
    }

    // ajax 数据过滤
    function ajaxDataFilter(data, type, settings) {

    	if(settings.dataFilter == empty) {
    		return data;
    	}

    	var context = settings.context;

    	return settings.dataFilter.call(context, data, type);
    }

    // 空函数，用于默认回调
    function empty() {}

    // 执行JSONP跨域获取数据,注意：此方法相对 $.ajax 没有优势，建议不要使用
    $.ajaxJSONP = function(options, deferred) {

        if(!('type' in options)) {
            return $.ajax(options);
        }

        var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName)) ? 
                _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
                $(script).triggerHandler('error', errorType || 'abort');
            },
            xhr = { abort: abort },
            abortTimeout;

        if(deferred) {
            deferred.promise(xhr);
        }

        $(script).on('load error', function(e, errorType) {
            clearTimeout(abortTimeout);
            $(script).off().remove();

            if(e.type == 'error' || !responseData) {
                ajaxError(null, errorType || 'error', xhr, options, deferred);
            } else {
                ajaxSuccess(responseData[0], xhr, options, deferred);
            }

            window[callbackName] = originalCallback;
            if(responseData && $.isFunction(originalCallback)) {
                originalCallback(responseData[0]);
            }

            originalCallback = responseData = undefined;
        });

        if(ajaxBeforeSend(xhr, options) === false) {
            abort('abort');

            return xhr;
        }

        window[callbackName] = function() {
            responseData = arguments;
        };

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);

        if(options.timeout > 0) {
            abortTimeout = setTimeout(function() {
                abort('timeout');
            }, options.timeout);
        }

        return xhr;
    };

    // 一个包含 ajax 请求的默认设置对象
    $.ajaxSettings = {
        type: 'GET',    // 默认请求方式
        beforeSend: empty,  // 请求之前回调
        success: empty, // 请求成功回调
        error: empty,   // 请求错误回调
        complete: empty,    // 请求完成回调
        context: null,  // 回调函数上下文
        global: true,   // 是否触发全局 ajax
        xhr: function() {
            return new window.XMLHttpRequest()
        },
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        crossDomain: false,
        timeout: 0,
        processData: true,
        cache: true,
        dataFilter: empty
    };

    // 数据类型
    function mimeToDataType(mime) {

        if(mime) {
            mime = mime.split(';', 2)[0];
        }

        return mime && (mime == htmlType ? 'html' : 
            mime == jsonType ? 'json' : 
            scriptTypeRE.test(mime) ? 'script' : 
            xmlTypeRE.test(mime) && 'xml') || 'text';
    }

    // 拼接 query 参数
    function appendQuery(url, query) {

        if(query == '') {
            return url;
        }

        return  (url + '&' + query).replace(/[&?]{1,2}/, '?');
    }

    // 序列化数据
    function serializeData(options) {

        if(options.processData && options.data && $.type(options.data) != 'string') {
            options.data = $.param(options.data, options.traditional);
        }

        if(options.data && (!options.type || options.type.toUpperCase() == 'GET') || 'jsonp' == options.dataType) {
            options.url = appendQuery(options.url. options.data);
            options.data = undefined;
        }
    }

    // ajax 请求
    $.ajax = function(options) {
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor, hashIndex;

        for(key in $.ajaxSettings) {

            if(settings[key] === undefined) {
                settings[key] = $.ajaxSettngs[key];
            }
        }

        ajaxStart(settings);

        // 是否跨域
        if(!settings.crossDomain) {
            urlAnchor = document.createElement('a');
            urlAnchor.href = settings.url;  // TODO: 为何重复赋值
            urlAnchor.href = urlAnchor.href;
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
        }

        if(!setting.url) {
            settings.url = window.location.toString();
        }

        if((hashIndex == settings.url.indexOf('#')) > -1) {
            settings.url = settings.url.slice(0, hashIndex);
        }
        serializeData(settings);

        var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url);
        if(hasPlaceholder) {
            dataType =  'jsonp';
        }

        if(settings.cache === false || ((!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType))) {
            settings.url = appendQuery(settings.url, '_=' + Date.now());
        }

        if('jsonp' == dataType) {

            if(!hasPlaceholder) {
                settings.url = appendQuery(settings.url, settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?');
            }

            return $.ajaxJSONP(settings, deferred);
        }

        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function(name, value) {
                headers[name.toLowerCase()] = [name, value];
            },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout;

        if(deferred) {
            deferred.promise(xhr);
        }

        if(!settings.crossDomain) {
            setHeader('X-Request-With', 'XMLHttpRequest');
        }
        setHeader('Accept', mime || '*/*');

        if(mime = settings.mimeType || mime) {

            if(mime.indexOf(',') > -1) {
                mime = mime.split(',', 2)[0];
            }
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }

        if(settings.contentType || (settings.contentType != false && settings.data && settings.type.toUpperCase() != 'GET')) {
            setHeader('Content-Type', settings.contentType || 'application/x-www.form-urlencoded');
        }

        if(settings.headers) {

            for(name in settings.headers) {
                setHeader(name, settings.headers[name]);
            }
        }
        xhr.setRequestHeader = setHeader;

        // 请求状态该表触发
        xhr.onreadystatechange = function() {

            if(xhr.readyState == 4) {
                xhr.onreadystatecharge = empty;
                clearTimeout(abortTimeout);
                var result, error = false;

                if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

                    if(xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob') {
                        result = xhr.response;
                    } else {
                        result = xhr.responseText;

                        try {
                            result = ajaxDataFilter(result, dataType, settings);

                            if(dataType == 'script') {
                                (1, eval)(result);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(result) ? null : $.parseJSON(result);
                            }
                        } catch (e) {
                            error = e;
                        }

                        if(error) {
                            return ajaxError(error, 'parseerror', xhr, settings, deferred);
                        }
                    }

                    ajaxSuccess(result, xhr, settings, deferred);
                } else {
                    ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred);
                }
            }
        };

        if(ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort();
            ajaxError(null, 'abort', xhr, settings, deferred);

            return xhr;
        }

        var async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async, settings.username, settings.password);

        if(settings.xhrFields) {

            for(name in settings.xhrFields) {
                xhr[name] = settings.xhrFields[name];
            }
        }

        for(name in headers) {
            nativeSetHeader.apply(xhr, headers[name]);
        }

        if(settings.timeout > 0) {
            abortTimeout = setTimeout(function() {
                xhr.onreadystatechange = empty;
                xhr.abort();
                ajaxError(null, 'timeout', xhr, settings, deferred);
            }, settings.timeout);
        }

        // 避免发送空串
        xhr.send(settings.data ? settings.data : null);

        return xhr;
    };

    // ajax get 请求,params => url, data, success, dataType
    $.get = function() {
        return $.ajax(parseArguments.apply(null, arguments));
    };

    // ajax post 请求,params => url, data, success, dataType
    $.post = function() {
        var options = parseArguments.apply(null, arguments);
        options.type = 'POST';

        return $.ajax(options);
    };

    // 通过 ajax get 方式获取 JSON 数据
    $.getJSON = function() {
        var options = parseArguments.apply(null, arguments);
        options.dataType = 'json';

        return $.ajax(options);
    };

    // 通过GET Ajax载入远程 HTML 内容代码并插入至 当前的集合 中
    $.fn.load = function(url, data, success) {

        if(!this.length) {
            return this;
        }
        var self = this,
            parts = url.split(/\s/),
            selector,
            options = parseArguments(url, data, success),
            callback = options.success;

        if(parts.length > 1) {
            options.url = parts[0];
            selector = parts[1];
        }

        options.success = function(response) {
            self.html(selector ? 
                $('<div>').html(response.replace(rscript, '')).find(selector) : response);
            callback && callback.apply(self, arguments);
        }
        $.ajax(options);

        return this;
    };

    var escape = encodeURIComponent;
    function serialize(params, obj, traditional, scope) {
        var type, array = $.isArray(obj),
            hash = $.isPlainObject(obj);
        $.each(obj, function(key, value) {
            type = $.type(value);

            if(scope) {
                key = traditional ? scope : 
                    scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
            }

            if(!scope && array) {
                params.add(value.name, value.value);
            } else if (type == 'array' || (!traditional && type == 'object')) {
                serialize(params, value, traditional, key);
            } else {
                params.add(key, value);
            }
        });
    }

    // 序列化一个对象,在Ajax请求中提交的数据使用URL编码
    $.param = function(obj, traditional) {
        var params = [];
        params.add = function(key, value) {

            if($.isFunction(value)) {
                value = value();
            }

            if(value == null) {
                value = '';
            }
            this.push(excape(key) + '=' + escape(value));
        };
        serialize(params, obj, traditional);

        return params.join('&').replace(/%20/g, '+');
    };
})(Zepto);