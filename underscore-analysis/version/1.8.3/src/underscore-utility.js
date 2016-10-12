/**
 * underscore 工具函数
 */

// 解决全局变量同名冲突
_.noConflict = function() {
    root._ = previousUnderscore;
    return this;
};

// 原值返回
_.identity = function(value) {
    return value;
};

// 返回常量
_.constant = function(value) {
    return function() {
        return value;
    };
};

// 空循环
_.noop = function() {};

// 获取属性值函数
_.property = property;

// 根据属性获取值
_.propertyOf = function(obj) {
    return obj == null ? function() {} : function(key) {
        return obj[key];
    };
};

_.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
        return _.isMatch(obj, attrs);
    };
};

// 一个函数执行 n 次
_.times = function(n, iteratee, context) {
    var accm = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
};

// 获取介于min、max之间的数字
_.random = function(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
};

// 获取当前时间戳
_.now = Date.now || function() {
    return new Date().getTime();
};

// 转义字符
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
};

var unescapeMap = _.invert(escapeMap);

var createEscaper = function(map) {

};

_.escape = createEscaper(escapeMap);

_.unescape = createEscaper(unescapeMap);

_.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
        value = fallback;
    }

    return _.isFunction(value) ? value.call(object) : value;
};

var idCounter = 0;
_.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
};

// template 方法使用正则
_.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g, // 匹配您想要直接一次性执行程序而不需要任何返回值的语句
    interpolate: /<%=([\s\S]+?)%>/g, // 逐字匹配嵌入代码的语句 <%=...%>
    escape: /<%-([\s\S]+?)%>/g // 转义 HTML 代码语句 <%-...%>
};

var noMatch = /(.)^/;
var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};
var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
var escapeChar = function(match) {
    return '\\' + escapes[match];
};

// 常用核心方法，例子：_.template($(id).html(), {key: value});
_.template = function(text, settings, oldSettings) {

    if (!settings && oldSettings) settings = oldSettings;

    settings = _.defaults({}, settings, _.templateSettings);

    var matcher = RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;

        if (escape) {
            source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
        } else if (interpolate) {
            source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        } else if (evaluate) {
            source += "';\n" + evaluate + "\n__p+='";
        }

        return match;
    });
    source += "';\n";

    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

    try {
        var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
        e.source = source;
        return e;
    }

    var template = function(data) {
        return render.call(this, data, _);
    };

    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
};