function Step() {
  var steps = Array.prototype.slice.call(arguments),
    pending, counter, results, lock;

  function next() {
    counter = pending = 0;
    if (steps.length === 0) {
      if (arguments[0]) {
        throw arguments[0];
      }
      return;
    }
    var fn = steps.shift();
    results = [];
    try {
      lock = true;
      var result = fn.apply(next, arguments);
    } catch (e) {
      next(e);
    }
    if (counter > 0 && pending == 0) {
      next.apply(null, results);
    } else if (result !== undefined) {
      next(undefined, result);
    }
    lock = false;
  }
  next.parallel = function () {
    var index = 1 + counter++;
    pending++;
    return function () {
      pending--;
      if (arguments[0]) {
        results[0] = arguments[0];
      }
      results[index] = arguments[1];
      if (!lock && pending === 0) {
        next.apply(null, results);
      }
    };
  };
  next.group = function () {
    var localCallback = next.parallel();
    var counter = 0;
    var pending = 0;
    var result = [];
    var error = undefined;

    function check() {
      if (pending === 0) {
        localCallback(error, result);
      }
    }
    process.nextTick(check);
    return function () {
      var index = counter++;
      pending++;
      return function () {
        pending--;
        if (arguments[0]) {
          error = arguments[0];
        }
        result[index] = arguments[1];
        if (!lock) {
          check();
        }
      };
    };
  };
  next();
}

Step.fn = function StepFn() {
  var steps = Array.prototype.slice.call(arguments);
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var toRun = [function () {
      this.apply(null, args);
    }].concat(steps);
    if (typeof args[args.length - 1] === "function") {
      toRun.push(args.pop());
    }
    Step.apply(null, toRun);
  };
};

if (typeof module !== "undefined" && "exports" in module) {
  module.exports = Step;
}
