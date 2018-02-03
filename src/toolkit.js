function isArray(collection) {

    return collection instanceof Array;

}

function each(collection, callback, context) {

    if (isArray(collection)) {
        for (var i = 0; i < collection.length; i++) {
            callback.call(context, collection[i], i);
        }
    } else {
        for (var key in collection) {
            collection.hasOwnProperty(key) && callback.call(context, collection[key], key);
        }
    }

}

function pick(target, from, keys) {

    keys.forEach(function(key) {
        if (from.hasOwnProperty(key)) {
            target[key] = from[key];
        }
    });

    return target;
}

function assign(target) {

    for (var i = 1; i < arguments.length; i++) {

        each(arguments[i], function(value, key) {
            typeof value !== 'undefined' && (target[key] = value);
        });

    }

    return target;

}

function where(collection, params) {

    return collection.filter(function(item) {

        var found = true;

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                found = params[key] === item[key];
                if (!found) {
                    break;
                }
            }
        }

        return found;

    });

}

function findWhere(collection, params) {

    var items = where(collection, params);
    return items.length ? items[0] : undefined;

}

module.exports = {
    assign: assign,
    each: each,
    isArray: isArray,
    pick: pick,
    where: where,
    findWhere: findWhere
};
