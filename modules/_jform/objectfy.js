(function($) {
    $.fn.toObject = function(options) {
        var result = [], settings = {
            mode: "first",
            delimiter: ".",
            skipEmpty: true,
            nodeCallback: null,
            useIdIfEmptyName: false
        };
        if (options) {
            $.extend(settings, options);
        }
        switch (settings.mode) {
          case "first":
            return form2js(this.get(0), settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName);
            break;

          case "all":
            this.each(function() {
                result.push(form2js(this, settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName));
            });
            return result;
            break;

          case "combine":
            return form2js(Array.prototype.slice.call(this), settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName);
            break;
        }
    };
})(jQuery);