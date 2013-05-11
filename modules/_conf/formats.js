var ini = require("../ini");

var formats = exports;

formats.json = {
    stringify: function(obj, replacer, spacing) {
        return JSON.stringify(obj, replacer || null, spacing || 2);
    },
    parse: JSON.parse
};

formats.ini = ini;