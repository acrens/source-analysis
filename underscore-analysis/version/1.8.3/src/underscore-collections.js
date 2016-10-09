/**
 * underscore 集合操作函数
 */

// 遍历集合且返回
_.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context); // 获取回调函数
    var i, length;

    // 此处个人觉得可以不用 if else，可以类似 map 处理
    if (isArrayLike(obj)) {

        // 每个值都需要回调一次
        for (i = 0, length = obj.length; i < length; i++) {
            iteratee(obj[i], i, obj);
        }
    } else {
        var keys = _.keys(obj); // 获取对象键数组，方便遍历
        for (i = 0, length = keys.length; i < length; i++) {
            iteratee(obj[keys[i]], keys[i], obj);
        }
    }

    return obj;
};

// 遍历集合且返回,iteratee return
_.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        results[index] = iteratee(obj[currentKey], currentKey, obj);
    }

    return results;
}

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

// 遍历查找 obj 中满足 predicate 要求的第一个值
_.find = _.detect = function(obj, predicate, context) {
    var key;

    // 获取查找满足要求的 key
    if (isArrayLike(obj)) {
        key = _.findIndex(obj, predicate, context);
    } else {
        key = _.findKey(obj, predicate, context);
    }

    // 如果查找内容存在，则返回值
    if (key !== void 0 && key !== -1) return obj[key];
};

// 过滤出满足 predicate 要求的数组
_.filter = _.select = function(obj, predicate, onctext) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
        if (predicate(value, index, list)) results.push(value);
    });

    return results;
};

// 过滤出不满足 predicate 要求的数组
_.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
}

// 检测 obj 中的项目是否都满足 predicate 的要求
_.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) || _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }

    return true;
};

// 检测 obj 中的项目是否至少有一个满足 predicate 的要求
_.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) || _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (predicate(obj[currentKey], currentKey, obj)) return true;
    }

    return false;
}

// 检测 obj 中是否存在 item
_.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
};

_.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
        var func = isFunc ? method : value[method];
        return func == null ? func : func.apply(value, args);
    });
}

// 过滤出 obj 中 key 对应值组成的数组
_.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
}

_.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
}

_.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
}

// 获取最大值
_.max = function(obj, iteratee, context) {
    var result = -Infinity,
        lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
            value = obj[i];
            if (value > result) {
                result = value;
            }
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

// 获取最小值
_.min = function(obj, iteratee, context) {
    var result = Infinity,
        lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
            value = obj[i];
            if (value < result) {
                result = value;
            }
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

// 洗牌，即打乱集合顺序
_.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length); // 存放乱序集合
    for (var index = 0, rand; index < length; index++) {
        rand = _.random(0, index); // 在已经存在集合随机获取
        if (rand !== index) shuffled[index] = shuffled[rand];
        shuffled[rand] = set[index];
    }

    return shuffled;
}

// 随机获取 n 个元素
_.sample = function(obj, n, guard) {
    if (n == null || guard) {
        if (!isArrayLike(obj)) obj = _.values(obj);
        return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
}

// 排序函数
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
    }), value);
};

// 将集合分组,规则为 behavior
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
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
};

// 返回对象长度
_.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
};

// 返回二维数组，下标为 0 的表示满足 predicate 要求，下标为 1 则为不满足
_.parttion = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [],
        fail = [];
    _.each(obj, function(value, key, obj) {
        (predicate(value, key, obj) ? pass : fail).push(value);
    });

    return [pass, fail];
};