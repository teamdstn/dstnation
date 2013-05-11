exports.extends = function(child, parent) {
    for (var key in parent) {
        if (hasOwnProperty.call(parent, key)) child[key] = parent[key];
    }
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
};

exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

var _tmps = {
    $0: require("__")
};

_tmps.$0.suction(exports, _tmps.$0);

delete _tmps.$0;