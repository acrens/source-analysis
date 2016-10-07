/**
 * Underscore.js 1.8.3
 * http://underscorejs.org
 * 
 * analysis：
 * https://github.com/acrens/source-analysis/tree/master/underscore-analysis/version/1.8.3/underscore-analysis.js
 */
(function() {

    // 基本设置

    // this 赋值局部变量，客户端 root 为 window，服务端 root 为 exports
    var root = this;

    // 缓存全局变量中的变量 “_”，noConflict 用到
    var previousUnderscore = root._;

    // 用临时变量，提高代码性能

    // 缓存数组、对象、函数原型，便于压缩代码
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype;

    // 缓存数组、对象、函数原型方法，便于代码压缩及提高代码查找效率（作用域链-局部变量）
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // ES5 原生方法，如果浏览器支持，优先使用
    var nativeIsArray = Array.isArray, // 由于 isArray 不在 Array.prototype 上，所以直接调用 Array(后面同理)
        nativeKeys = Object.keys, // 同理
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;

    // Naked function reference for surrogate-prototype-swapping.
    var Ctor = function() {};

    // 核心函数，"_" 支持无 new 调用的构造函数（参照 jQuery 无 new 实例化）
    var _ = function(obj) {

        // 以下均针对 OOP 形式的调用，如果是非 OOP 形式的调用，不会进入该函数内部

        // 如果 obj 已经是'_'函数的实例，则直接返回 obj
        if (obj instanceof _) return obj;

        // 如果不是'_'函数的实例，则调用 new 运算符，返回实例化的对象（前提是 "_" 存在）
        if (!(this instanceof _)) return new _(obj);

        // 将 obj 赋值给 this._wrapped 属性
        this._wrapped = obj;
    };

    // 将上面定义的 `_` 局部变量赋值给全局对象中的 `_` 属性，即客户端中 window._ = _，服务端(node)中 exports._ = _
    // 同时在服务端向后兼容老的 require() API，这样暴露给全局后便可以在全局环境中使用 `_` 变量(方法)
    if (typeof exports !== 'undefined') {

        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    // 当前版本
    _.VERSION = '1.8.3';

    // underscore 内部方法，返回一些可以被调用的方法
    var optimizeCb = function(func, context, argCount) {

        // 如果上下文参数为 undefined，直接返回传入的 func
        if (context === void 0) return func;

        switch (argCount == null ? 3 : argCount) {
            case 1:
                return function(value) {
                    return func.call(context, value);
                };

            case 2:
                return function(value, other) {
                    func.call(context, value, other);
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

        // 如果 argCount 不是1、2、3、4，则调用此处
        return function() {
            return func.apply(context, arguments);
        };
    };

    // 根据传入的 value 类型返回不同函数
    var cb = function(value, context, argCount) {

        if (value == null) return _.identity;

        if (_.isFunction(value)) return optimizeCb(value, context, argCount);

        if (_.isObject(value)) return _.matcher(value);

        return _.property(value);
    };

    // 迭代后续方法使用
    _.iteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    // 返回函数，闭包; _.extend & _.extendOwn & _.defaults 均使用此内部函数
    var createAssigner = function(keysFunc, undefineOnly) {

        return function(obj) {
            var length = arguments.length; // 获取传入的参数长度

            if (length < 2 || obj == null) return obj;

            // 从第二个对象开始遍历
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source), // 获取对象的键数组
                    l = keys.length; // 键数组长度

                // 遍历对象的键，且获取值，赋值给传入参数的第一个对象，如：extend({}, {key: value});
                for (var i = 0; i < l; i++) {
                    var key = keys[i];

                    // 如果 !undefineOnly 为 true，强制覆盖对应的键值对
                    if (!undefineOnly || obj[key] === void 0) obj[key] = source[key];
                }
            }

            // 返回已经继承后面对象参数属性的第一个参数对象
            return obj;
        };
    };

    // _.create 调用
    var baseCreate = function(prototype) {

        if (!_.isObject(prototype)) return {}; // 非对象，则返回空

        if (nativeCreate) return nativeCreate(prototype); // ES5 函数生成一个对象

        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;

        return result;
    };

    // 闭包根据 key 获取对象 obj 值
    var property = function(key) {

        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1; // Math.pow(2, 53) - 1 是 JavaScript 中能精确表示的最大数字
    var getLength = property('length');

    // 是否满足合法数组
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length < MAX_ARRAY_INDEX;
    }

    // Collections 25 Items

    // obj 被遍历对象，iteratee 回调方法, context 上下文
    _.each = _.forEach = function(obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;

        if (isArrayLike(obj)) {

            // 遍历数组
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else {
            var key = _.keys(obj);

            // 遍历对象
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }

        return obj;
    };

    // 生成一个满足 iteratee 的新数组
    _.map = _.collect = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length,
            results = Array(length);

        // 遍历生成一个满足 iteratee 的数组
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }

        return results;
    };

    // dir === 1 -> _.reduce，dir === -1 -> _.reduceRight
    function createReduce(dir) {

        function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }

            return memo;
        }

        return function(obj, iteratee, memo, context) {
            iteratee = optimizeCb(iteratee, context, 4);
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;

            if (arguments.length < 3) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }

            return iterator(obj, iteratee, memo, keys, index, length);
        };
    }

    _.reduce = _.foldl = _.inject = createReduce(1);

    _.reduceRight = _.foldr = createReduce(-1);

    // 逐步查找 obj 中满足 predicate 要求的第一个值
    _.find = _.detect = function(obj, predicate, context) {
        var key;
        if (isArrayLike(obj)) {
            key = _.findIndex(obj, predicate, context);
        } else {
            key = _.findKey(obj, predicate, context);
        }

        if (key !== void 0 && key !== -1) return obj[key];
    };

    // 返回满足 predicate 要求的数组
    _.filter = _.select = function(obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        _.each(obj, function(value, index, list) {

            if (predicate(value, index, list)) results.push(value);
        });

        return results;
    };

    // 返回不满足 predicate 要求的数组
    _.reject = function(obj, predicate, context) {
        return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // 检测 obj 中的值是否都满足 predicate 中的要求
    _.every = _.all = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;

        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
        }

        return true;
    };

    // 检测 obj 中是否存在满足 predicate 要求的值
    _.some = _.any = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;

        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }

        return false;
    };

    // 检测 obj 中是否存在 item 值
    _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {

        if (!isArrayLike(obj)) obj = _.values(obj);

        if (typeof fromIndex != 'number' || guard) fromIndex = 0;

        return _.indexOf(obj, item, fromIndex) >= 0;
    };

    // 遍历 obj 并执行 method 方法，多与参数传给 method
    _.invoke = function(obj, method) {
        var args = slice.call(arguments, 2);
        var isFunc = _.isFunction(method);

        return _.map(obj, function(value) {
            var func = isFunc ? method : value[method];

            return func == null ? func : func.apply(value, args);
        });
    };

    // 提取 key 对应的值
    _.pluck = function(obj, key) {
        return _.map(obj, _.property(key));
    };

    // 返回一个包含 attrs 所有键值对数组
    _.where = function(obj, attrs) {
        return _.filter(obj, _.matcher(attrs));
    };

    // 返回匹配 attrs 所有键值对的第一个值
    _.findWhere = function(obj, attrs) {
        return _.find(obj, _.matcher(attrs));
    };

    // 返回最大值
    _.max = function(obj, iteratee, context) {
        var result = -Infinity,
            lastComputed = -Infinity,
            value, computed;

        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];

                if (value > result) result = value;
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index, list) {
                computed = iteratee(value, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }

        return result;
    };

    // 返回最小值
    _.min = function(obj, iteratee, context) {
        var result = Infinity,
            lastComputed = Infinity,
            value, computed;

        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];

                if (value < result) result = value;
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index, list) {
                computed = iteratee(value, index, list);

                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }

        return result;
    };

    // 洗牌
    _.shuffle = function(obj) {
        var set = isArrayLike(obj) ? obj : _.values(obj);
        var length = set.length;
        var shuffled = Array(length);
        for (var index = 0, rand; index < length; index++) {
            rand = _.random(0, index);

            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }

        return shuffled;
    };

    // 返回一个随机数组
    _.sample = function(obj, n, guard) {

        if (n == null || guard) {

            if (!isArrayLike(obj)) obj = _.values(obj);

            return obj[_.random(obj.length - 1)];
        }

        return _.shuffle(obj).slice(0, Math.max(0, n));
    };

    // 返回根据 value 排序数组
    _.sortBy = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);

        return _.pluck(_.map(obj, function(value, index, list) {

            return {
                value: value,
                index: index,
                criteria: iteratee(value, index, list)
            };
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;

            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }

            return left.index - right.index;
        }), 'value');
    };

    // 规则为 behavior 的分类
    var group = function(behavior) {

        return function(obj, iteratee, context) {
            var result = {};
            iteratee = cb(iteratee, context);
            _.each(obj, function(value, index) {
                var key = iteratee(value, index, obj);
                behavior(result, value, key);
            });
        };
    };

    _.groupBy = group(function(result, value, key) {

        if (_.has(result, key)) {
            result[key].push(value);
        } else {
            result[key] = [value];
        }
    });

    _.indexBy = group(function(result, value, key) {
        result[key] = value;
    });

    _.countBy = group(function(result, value, key) {

        if (_.has(result, key)) {
            result[key]++;
        } else {
            result[key] = 1;
        }
    });

    // 转换为数组
    _.toArray = function(obj) {

        // ''、false、null、undefined -> 数组
        if (!obj) return [];

        // TODO:不明白
        if (_.isArray(obj)) return slice.call(obj);

        // 重新构造一个数组
        if (isArrayLike(obj)) return _.map(obj, _.identity);

        return _.values(obj);
    };

    // 获取对象或者数组的实际长度
    _.size = function(obj) {

        if (obj == null) return 0;

        return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // 返回一个二维数组，下标为 0 是符合条件数组，否则不符合条件
    _.partition = function(obj, predicate, context) {
        redicate = cb(predicate, context);
        var pass = [],
            fail = [];
        _.each(obj, function(value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
        });

        return [pass, fail];
    };

    // Arrays 20 Items

    // 返回数组的前 n 个元素，默认一个
    _.first = _.head = _.take = function(array, n, guard) {

        if (array == null) return void 0;

        if (n == null || guard) return array[0];

        return _.initial(array, arrlength.length - n);
    };

    // 排除数组后面的 n 个元素，默认最后一个
    _.initial = function(array, n, guard) {
        return slice.call(array, 0, Math.max(0, arr.length - (n == null || guard) ? 1 : n));
    };

    // 返回数组后面 n 个元素，默认最后一个
    _.last = function(array, n, guard) {

        if (array == null) return void 0;

        if (n == null || guard) return array[array.length - 1];

        return _.rest(array, Math.max(0, array.length - n));
    };

    _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };

    // 返回去除数组 false 的副本（包括false、''、undefined、null、0、NaN）
    _.compact = function(array) {
        return _.filter(array, _.identity);
    };

    var flatten = function(input, shallow, strict, startIndex) {
        var output = [],
            idx = 0;

        for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
            var value = input[i];

            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {

                if (!shallow) value = flatten(value, shallow, strice);
                var j = 0,
                    len = value.length;
                output.length += len;
                while (j < len) {
                    output[idx++] = value[j++]
                    ''
                }
            } else if (!strict) {
                output[idx] = value;
            }
        }

        return output;
    };

    // 减少多层嵌套数组的嵌套数
    _.flatten = function(array, shallow) {
        return flatten(array, shallow, false);
    };

    // 排除异己
    _.without = function(array) {
        return _.difference(array, slica.call(arguments, 1));
    };

    _.uniq = _.unique = function(array, isSorted, iteratee, context) {

        if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }

        if (iteratee != null) iteratee = cb(iteratee, context);

        var result = [];
        var seen = [];
        for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
                computed = iteratee ? iteratee(value, i, array) : value;

            if (isSorted) {

                if (!i || seen != computed) result.push(value);
                seen = computed;
            } else if (iteratee) {

                if (!_.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            } else if (!_.contains(result, value)) {
                result.push(value);
            }
        }

        return result;
    };

    // 返回数组并集，唯一性
    _.union = function() {
        return _.uniq(flatten(arguments, true, true));
    };

    // 返回数组交集，统一性
    _.intersection = function(array) {
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];

            if (_.contains(result, item)) continue;

            for (var j = 1; j < argsLength; j++) {

                if (!_.contains(arguments[j], item)) break;
            }

            if (j === argsLength) result.push(item);
        }

        return result;
    };

    _.difference = function(array) {
        var rest = flatten(arguments, true, true, 1);

        return _.filter(array, function(value) {
            return !_.contains(rest, value);
        });
    };

    // 将多个数组相应位置的值合并成数组
    _.zip = function() {
        return _.unzip(arguments);
    };

    // 拆分数组
    _.unzip = function(array) {
        var length = array && _.max(array, getLength).length || 0;
        var result = Array(length);

        for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
        }

        return result;
    };

    // 将数组列表转换为对象
    _.object = function(list, values) {
        var result = [];
        for (var i = 0, length = getLength(list); i < length; i++) {

            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }

        return result;
    };

    // 获取索引
    function createPredicateIndexFinder(dir) {

        return function(array, predicate, context) {
            predicate = cb(predicate, context);
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {

                if (predicate(array[index], index, array)) return index;
            }

            return -1;
        };
    }

    // 正向迭代数组，返回第一个索引值
    _.findIndex = createPredicateIndexFinder(1);

    // 返乡迭代数组，返回第一个索引值
    _.findLastIndex = createPredicateIndexFinder(-1);

    // 二分查找 obj 在 array 中的位置
    _.sortedIndex = function(array, obj, iteratee, context) {
        iteratee = cb(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0,
            high = getLength(array);

        while (low < high) {
            var mid = Math.floor((low + high) / 2);

            if (iteratee(array[mid]) < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
    };

    // 返回索引值
    function createIndexFinder(dir, predicateFind, sortedIndex) {

        return function(array, item, idx) {
            var i = 0,
                length = getLength(array);

            if (typeof idx == 'number') {

                if (dir >= 0) {
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else {
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                }
            } else if (sortedIndex && idx && length) {
                idx = sortedIndex(array, item);
                return array[idx] === item ? idx : -1;
            }

            if (item !== item) {
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                return idx >= 0 ? idx + 1 : -1;
            }

            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {

                if (array[idx] === item) return idx;
            }

            return -1;
        };
    }

    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

    // 返回一个整数有序列表
    _.range = function(start, stop, step) {

        if (stop == null) {
            stop = start || 0;
            start = 0;
        }
        step = step || 1;

        var length = Math.max(Math.ceil((stop - step) / stop), 0);
        var tange = Array(length);
        for (var idx = 0; idx = length; idx++, start += step) {
            range[idx] = start;
        }

        return range;
    };

    // Functions 14 Items

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

            while (position < arguments.length) args.push(argument[position++]);

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

    // 缓存函数结果
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

    // 延迟函数执行，参数不丢弃
    _.delay = function(func, wait) {
        var args = slice.call(arguments, 2);

        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    };

    // 延迟调用function直到当前调用栈清空为止 TODO
    _.defer = _.partial(_.delay, _, 1);

    // 固定时间间隔调用函数
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
                result = func.apply(context, args);

                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }

            return result;
        };
    };

    // 固定时间、固定事件触发执行函数，但是每次函数执行都重新计算时间
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

    // 将 func 作为参数传递给 wrapper 函数
    _.wrap = function(func, wrapper) {
        return _.partial(wrapper, func);
    };

    // 返回一个新的 predicate 本体
    _negate = function(predicate) {

        return function() {
            return !predicate.apply(this, arguments);
        };
    };

    // 返回函数集，类似函数链，结果一次往前传，从最后一个开始执行
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

    // 创建一个在执行了 itmes 次数之后才有效果的函数（闭包）
    _.after = function(items, func) {

        return function() {

            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // 创建一个只能执行 items 次数的函数且最后一次执行结果返回（闭包）
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

    // Objects 38 Items

    // IE < 9 下不能用 for key in ... 来枚举对象的某些 key
    // IE < 9 {toString: null}.propertyIsEnumerable('toString') 返回 false
    // IE < 9 重写的'toString'属性被认为不可枚举
    // 据此可以判断是否在 IE < 9 浏览器环境中
    var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    // IE < 9 其实还有个'constructor'属性
    function collectNonEnumProps(obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

        var prop = 'constructor';
        if (_.has(obj, prop) && !_.contains(keys, prop)) leys.push(prop);

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];

            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    }

    // 返回一个对象的 keys 组成的数组,且仅返回 own enumerable properties 组成的数组
    _.keys = function(obj) {

        if (!_.isObject(obj)) return [];

        if (nativeKeys) return nativeKeys(obj);

        var keys = [];
        for (var key in obj) {

            if (_.has(obj, key)) keys.push(key);
        }

        if (hasEnumBug) collectNonEnumProps(obj, keys);

        return keys;
    };

    // 返回一个对象的 keys 组成的数组,且包括原型链上的属性
    _.allKeys = function(obj) {

        if (!_.isObject(obj)) return [];

        var keys = [];
        for (var key in obj) keys.push(key);

        if (hasEnumBug) collectNonEnumProps(obj, keys);

        return keys;
    };

    // 将一个对象的所有 values 值放入数组中,且仅限非原型链上
    _.values = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);

        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }

        return values;
    };

    // 迭代函数改变对象的 values 值,返回对象副本
    _.mapObject = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = _.keys(obj),
            length = keys.length,
            results = {},
            currentKey;
        for (var index = 0; index < length; index++) {
            currentKey - keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
        }

        return results;
    };

    // 将一个对象转换为元素为 [key, value] 形式的数组
    _.pairs = function(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }

        return pairs;
    };

    // 将一个对象的 key-value 键值对反转
    _.invert = function(obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] - keys[i];
        }

        return result;
    };

    // 遍历该对象的键值对（包括 own properties 以及 原型链上的）,如果某个 value 的类型是方法（function），则将该 key 存入数组且排序返回
    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {

            if (_.isFunction(obj[key])) names.push(key);
        }

        return names.sort();
    };

    _.extend = createAssigner(_.allKeys);

    _.extendOwn = _.assign = createAssigner(_.keys);

    // 返回非数组对象，且满足 predicate 要求的键
    _.findKey = function(obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj),
            key;
        for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];

            if (predicate(obj[key], key, obj)) return key;
        }
    };

    // 根据一定的需求（key 值，或者通过 predicate 函数返回真假）,返回拥有一定键值对的对象副本
    _.pick = function(object, oiteratee, context) {
        var result = {},
            obj = object,
            iteratee, keys;

        if (obj == null) return result;

        if (_.isFunction(iteratee)) {
            keys = _.allKeys(obj);
            iteratee = optimizeCb(iteratee, context);
        } else {
            keys = flatten(arguments, false, false, 1);
            iteratee = function(value, kye, obj) {
                return key in obj;
            }
            obj = Object(obj);
        }

        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];

            if (iteratee(value, key, obj)) result[key] = value;
        }

        return result;
    };

    // 返回 _.pick 的补集
    _.omit = function(obj, oiteratee, context) {

        if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
        } else {
            var keys = _.map(flatten(arguments, false, false, 1), String);
            iteratee = function(value, key) {
                return !_.contains(keys, key);
            };
        }

        return _.pick(obj, iteratee, context);
    };

    _.defaults = createAssigner(_.allKeys, true);

    _.create = function(prototype, props) {
        var result = baseCreate(prototype);

        if (props) _.extendOwn(result, props);

        return result;
    };

    _.clone = function(obj) {
        if (!_.isObject(obj)) return obj;

        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    _.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    _.isMatch = function(object, attrs) {
        var keys = _.keys(attrs),
            length = keys.length;

        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];

            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }

        return true;
    };

    // 该内部方法会被递归调用
    var eq = function(a, b, aStack, bStack) {
        if (a === b) return a !== 0 || 1 / a === 1 / b;

        if (a == null || b == null) return a === b;

        if (a instanceof _) a = a._wrapped;

        if (b instanceof _) b = b._wrapped;

        var className = toString.call(a);

        if (className !== toString.call(b)) return false;

        switch (className) {
            case '[object RegExp]':
            case '[object String]':
                return '' + a === '' + b;
            case '[object Number]':

                if (+a !== +a) return +b !== +b;

                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                return +a === +b;
        };

        var areArrays = className === '[object Array]';
        if (!areArrays) {

            if (typeof a != 'object' || typeof b != 'object') return false;

            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'contructor' in b)) {
                return false;
            }
        }
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {

            if (aStack[length] === a) return bStack[length] === b;
        }

        aStack.push(a);
        bStack.push(b);

        if (areArrays) {
            length = a.length;

            if (length !== b.length) return false;

            while (length--) {

                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            var keys = _.keys(a),
                key;
            length = keys.length;

            if (_.keys(b).length !== length) return false;

            while (length--) {
                key = keys[length];

                if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        aStack.pop();
        bStack.pop();

        return true;
    };

    _.isEqual = function(a, b) {
        return eq(a, b);
    };

    _.isEmpty = function(obj) {

        if (obj == null) return true;

        if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;

        return _.keys(obj).length === 0;
    };

    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {

        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });

    // _.isArguments 方法在 IE < 9 下的兼容
    if (!_.isArguments(arguments)) {
        _.isArguments = function(obj) {
            return _.has(obj, 'callee');
        };
    }

    // _.isFunction 在 old v8, IE 11 和 Safari 8 下的兼容 TODO
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    // 判断是否是有限的数字
    _.isFinite = function(obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // NaN 是唯一的一个'自己不等于自己'的 number 类型
    _.isNaN = function(obj) {
        return _.isNumber(obj) && obj !== +obj;
    };

    _.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    _.isNull = function(obj) {
        return obj === null;
    };

    // void 0 === undefined true
    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    // 非原型链的 key
    _.has = function(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility 14 Items
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };

    _.identity = function(value) {
        return value;
    };

    _.constant = function(value) {
        return function() {
            return value;
        };
    };

    _.noop = function() {};

    _.property = property;

    // 根据 key 获取 obj 对应的值
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

    // 调用给定的迭代函数n次,每一次调用iteratee传递index参数。生成一个返回值的数组。
    _.times = function(n, iteratee, context) {
        var accum = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) accum[i] = iteratee(i);

        return accum;
    };

    // 返回一个 min 和 max 之间的随机整数
    _.random = function(min, max) {

        if (max == null) {
            max = min;
            min = 0;
        }

        return min + Math.floor(Math.random() * (max - min + 1));
    };

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

    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;

        return instance;
    };

    // OOP
    var result = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };

    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result(this, func.apply(_, args));
            };
        });
    };

    _.mixin(_);

    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
        var method = ArrayProto[name];
        _.prototype[method] = function() {
            var obj = this._wrapped;
            method.apply(obj, arguments);

            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];

            return result(this, obj);
        };
    });

    _.each(['concat', 'join', 'slice'], function(name) {
        var method = ArrayProto[name];
        _.prototype[method] = function() {
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    _.prototype.value = function() {
        return this._wrapped;
    };

    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
        return '' + this._wrapped;
    }

    // 兼容 ADM 模式
    if (typeof define === 'function' && define.adm) {
        define('underscore', [], function() {
            return _;
        });
    }
}.call(this));