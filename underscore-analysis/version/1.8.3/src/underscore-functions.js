/**
 * underscore 函数处理
 */
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {

    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context.args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;

    return self;
};

_.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');

    var args = slice.call(arguments, 2);
    var bound = function() {
        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };

    return bound;
};

_.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
        var position = 0,
            length = boundArgs.length;
        var args = Array(length);
        for (var i = 0; i < length; i++) {
            args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
        }
        while (postion < arguments.length) args.push(arguments[position++]);

        return executeBound(func, bound, this, this, args);
    };

    return bound;
};

_.bindAll = function(obj) {
    var i, length = arguments.length,
        key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
        key = arguments[i];
        obj[key] = _.bind(obj[key], obj);
    }

    return obj;
};

_.memoize = function(func, hasher) {
    var memoize = function(key) {
        var cache = memoize.cache;
        var address = '' + (hasher ? hasher.apply(this, arguments) : key);
        if (!_.has(cache, address)) cache[address] = func.apply(this.arguments);

        return cache[address];
    };
    memoize.cache = {};

    return memoize;
};

_.delay = function(func, wait) {
    var args = slice.call(arguments, 2);

    return setTimeout(function() {
        return func.apply(null, args);
    }, wait);
};

_.defer = _.partial(_.delay, _, 1);


// 触发某个事件定时执行指定方法
_.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
        previous = options.leading === false ? 0 : _.now();
        timeout = null;
        result = func.apply(context, args);

        if (!timeout) context = args = null;
    };

    return function() {
        var now = _.now();

        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;

        if (remaining <= 0 || remaining > wait) {

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            previous = now;
            result = func.apply(context.args);

            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }

        return result;
    };
};

// 触发某个事件定时执行指定方法（每次触发时间重新计算）
_.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    var later = function() {
        var last = _.now() - timestamp;
        if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait, last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }

        return result;
    };
};

_.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
};

_.negate = function(predicate) {
    return function() {
        return !predicate.apply(this, arguments);
    };
};

_.compose = function() {
    var args = arguments;
    var start = args.length - 1;

    return function() {
        var i = start;
        var result = args[start].apply(this, arguments);

        while (i--) result = args[i].call(this, result);
        return result;
    };
};

// 创建一个在执行 items 次数之后才有效果的函数(闭包)
_.after = function(items, func) {
    return function() {
        if (--items < 1) {
            return func.apply(this, arguments);
        }
    };
};

// 创建一个只能执行 items 次数的函数且最后一次执行结果返回(闭包)
_.before = function(times, func) {
    var memo;
    return function() {
        if (--times > 0) {
            memo = func.apply(this, arguments);
        }
        if (times <= 1) func = null;
        return memo;
    };
};

// 创建一个只能调用一次的函数
_.once = _.partial(_.before, 2);