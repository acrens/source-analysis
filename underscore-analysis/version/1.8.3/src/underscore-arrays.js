/**
 * underscore 数组操作函数
 */

// 默认获取第一个元素
_.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0; // 返回 undefined
    if (n == null || guard) return array[0]; // 返回第一个元素
    return _.initial(array, array.length - n);
};

// 返回前 length - n 个元素
_.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
};

// 默认获取最后一个元素
_.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
};

// 返回后 length - n 个元素
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

// 去除相同元素，保留唯一性
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

            if (!i || seen != computed) return result.push(value);
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
};

// 返回数组并集
_.union = function() {
    return _.uniq(flatten(arguments, true, true));
};

// 返回数组交集
_.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
        var item = array[i];
        if (_.contains(result, item)) continue;
        for (var j = 1; j < arguments; j++) {
            if (!_.contains(arguments[i], item)) break;
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

// 合并数组
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

// 对象转换为数组
_.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {

        if (values) {
            result[list[i]] = values[i];
        } else {
            result[list[i][0]] = list[i][1];
        }
    }
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

// 二分查找法获取元素所在位置
_.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0,
        high = getLength(array);
    while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (iteratee(array[mid]) < value) low = mid + 1;
        else high = mid;
    }

    return low;
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

// 返回一个整数有序列表数组
_.range = function(start, stop, step) {

    if (stop == null) {
        stop = start || 0;
        start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);
    for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
    }

    return range;
};