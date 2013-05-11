var models = {};
var sets = {};

sets.makeSafe(str, allowed) {
  var w = "!@#$%^&*()+=[]\\\';,./{}|\":<>?",
    s = 'abcdefghijklmnopqrstuvwxyz0123456789-_',
    x = ['àáâãäå', 'ç', 'èéêë', 'ìíîï', 'ñ', 'ðóòôõöø', 'ùúûü', 'ýÿ'],
    r = ['a', 'c', 'e', 'i', 'n', 'o', 'u', 'y'],
    rst //safeurl;

  str = str.toLowerCase();
  allowed && (s = s + ' ');

  for (var i = 0, len = str.length, nstr = [], chr; i < len; i++) {
    chr = str.charAt(i);
    if (w.indexOf(chr) == -1) {
      if (s.match('' + chr + '')) {
        nstr[i] = chr;
      } else {
        for (var j = 0; j < x.length; j++) {
          if (x[j].match(chr)) {
            nstr[i] = r[j];
          }
        }
      }
    }
  }
  rst = (nstr.join('')).replace(/\s/g, "-");
  return rst;
}

var __group = {
  "schema": {
    "_id": {
      "type": String,
      "required": true,
      "unique": true,
      "index": true
    }
  }
}

var __human = {
  "schema": {
    "_group": {
      "type": String,
      "required": true,
      "default": "user",
      "ref": 'Groups'
    },
    "name": {
      "type": String,
      "required": true,
      "dp": "CRUD"
    },
    "random_string": {
      "type": String
    }
  },
  "options": {
    "desc": {
      "dummy": []
    }
    /* ==== Default ====;
    , safe:true
    , strict:true
    */
  },
  "plugins": ['auth', 'timestamp', 'pagination']
}


var __ecash = {

};

var __smsgs = {

};

var __restrict = {

};

var __contents = {
  "schema": {
    "title": {
      "type": String,
      "required": true,
      "unique": true
    },
    "content": {
      "type": String,
      "required": true
    },
    "handle": {
      "type": String,
      "required": true,
      "unique": true,
      "set": sets.makeSafe
    },
    "meta": {
      "keywords": String,
      "description": String
    }
  },
  "plugins": ['timestamp', 'pagination', 'nested']
};

models.smsgs  = __smsgs;
models.group  = __group;
models.human  = __human;
models.ecash  = __ecash;
models.restrict  = __restrict;

models.contents = __contents;