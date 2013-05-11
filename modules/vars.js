module.exports = function (store) {
  function getset (name, value) {
    var node = vars.store;
    var chop = name.split('.');
    chop.slice(0,-1).forEach(function (k) {
        if (node[k] === undefined) node[k] = {};
        node = node[k]
    });
    var key = chop[chop.length - 1];
    if (arguments.length == 1) {
        return node[key];
    }
    else {
        return node[key] = value;
    }
  }
  var vars = {
    get       : function (name) { return getset(name); },
    set       : function (name, value) { return getset(name, value); },
    enable    : function (name) { return this.set(name, true);  },
    disable   : function (name) { return this.set(name, false); },
    enabled   : function (name) { return !!this.get(name);      },
    disabled  : function (name) { return !this.get(name);       },
    store     : store || {},
  };
  return vars;

};


