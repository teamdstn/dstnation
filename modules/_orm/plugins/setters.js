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


