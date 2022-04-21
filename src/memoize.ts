function memoize<TA extends Object, TR>(map: WeakMap<TA, TR>, fn: (arg: TA) => TR) {
    return function () {
        const arg: TA = arguments[0];
        if (!map.has(arguments[0])) {
            map.set(arguments[0], fn(arg)); // use func.apply(null, arguments) instead to support additional params?
        }
        return map.get(arguments[0])
    }
}