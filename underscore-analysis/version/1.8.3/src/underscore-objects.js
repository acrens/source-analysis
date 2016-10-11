/**
 * underscore 对象操作函数
 */

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

// 返回一个对象不包含原型链属性数组
_.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);

    var keys = [];
    for (var key in obj)
        if (_.has(obj, key)) keys.push(key);
    if (hasEnumBug) collectNonEnumProps(obj, keys);

    return keys;
};

// 返回一个对象包含原型链属性数组
_.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];

    var keys = [];
    for (var key in obj) keys.push(key);

    if (hasEnumBug) collectNonEnumProps(obj, keys);

    return keys;
};

// 返回对象值组成数组
_.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
    }

    return values;
};

// 迭代对象返回副本
_.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {},
        currentKey;
    for (var index = 0; index < length; index++) {
        currentKey = keys[index];
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

// 将对象的 key-value 反转
_.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
        result[obj[keys[i]]] - keys[i];
    }

    return result;
};

_.functions = _.method = function(obj) {
    var names = [];
    for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
    }

    return names.sort();
};

_.extend = createAssigner(_.allKeys);
_.extendOwn = _.assign = createAssigner(_.keys);

_.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj),
        key;
    for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (predicate(obj[key], key, obj)) return key;
    }
};

_.pick = function(object, oiteratee, context) {
    
};