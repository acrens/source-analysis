/**
 * underscore 基础配置及配置方法
 */

(function() {
    var root = this; // 全局上下文，window or exports
    var previousUnderscore = root._; // 暂存上下文存在的 _

    // 数组、对象、函数原型
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype;

    // 数组、对象原型链函数
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // 数组、对象非原型链函数，函数原型链函数[ES5 存在函数]
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;

    var Ctor = function() {};
    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    // 导出 underscore 对象，浏览器则导出 _，服务器则导出 exports
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _; // 浏览器导出至上下文 root
    }

    // 版本描述
    _.VERSION = '1.8.3';

    // 通过函数参数及上下文优化可被调用函数
    var optimizeCb = function(func, context, argCount) {
        if (context === void 0) return func;
        switch (argCount == null ? 3 : argCount) {
            case 1:
                return function(value) {
                    return func.call(context, value);
                };
            case 2:
                return function(value, other) {
                    return func.call(context, value, other);
                };
            case 3:
                return function(value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            case 4:
                return function(accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                };
        }

        return function() {
            return func.apply(context, arguments);
        };
    };

    // 根据 value 的类型返回不同的函数
    var cb = function(value, context, argCount) {
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };

    _.iteratee = function(value, context) {
        return cb(value, context, Infinity);
    }

    // _.extend & _.extendOwn & _.defaults 均使用此内部函数，合并多个数组
    var createAssigner = function(keysFunc, undefinedOnly) {
        return function(obj) {
            var length = arguments.length;
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source),
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
                }
            }

            return obj;
        };
    };

    // _.create 调用
    var baseCreate = function(prototype) {
        if (!_.isObject(prototype)) return {};
        if (nativeCreate) return nativeCreate(prototype);
        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    };

    // 根据对象属性获取对应的值
    var property = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1; // JS 最大安全值
    var getLength = property('length'); // 获取长度函数

    // 长度合法的对象（数组、字符串等）
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // 返回一个 underscore 对象，使支持链式调用
    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };

    // OOP 链式调用
    var result = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    _.mixin = function(obj) {
        _.each(_.function(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(_, args));
            };
        });
    };

    _.mixin(_);

    // 新增访问数组的函数
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
        };
    });

    // 新增访问数组的函数
    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    _.prototype.value = function() {
        return this._wrapped;
    };

    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
        return '' + this._wrapped;
    };

    // define 导出，兼容 AMD 规范
    if (typeof define === 'function' && define.amd) {
        define('underscore', [], function() {
            return _;
        });
    }
}.call(this));