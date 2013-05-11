(function() {
    "use strict";
    function isSequence(obj) {
        return obj instanceof Sequence;
    }
    function Sequence(global_context) {
        var self = this, waiting = true, data, stack = [];
        if (!isSequence(this)) {
            return new Sequence(global_context);
        }
        global_context = global_context || null;
        function next() {
            var args = Array.prototype.slice.call(arguments), seq = stack.shift();
            data = arguments;
            if (!seq) {
                waiting = true;
                return;
            }
            args.unshift(next);
            seq.callback.apply(seq.context, args);
        }
        function then(callback, context) {
            if ("function" !== typeof callback) {
                throw new Error("`Sequence().then(callback [context])` requires that `callback` be a function and that `context` be `null`, an object, or a function");
            }
            stack.push({
                callback: callback,
                context: null === context ? null : context || global_context,
                index: stack.length
            });
            if (waiting) {
                waiting = false;
                next.apply(null, data);
            }
            return self;
        }
        self.next = next;
        self.then = then;
    }
    function createSequence(context) {
        return new Sequence(context);
    }
    Sequence.create = createSequence;
    Sequence.isSequence = isSequence;
    module.exports = Sequence;
})();