exports.googleTranslate = function (str, _o, next) {
  var apiKey = "AIzaSyCmzrT8lV8VglV7Wmik6abOqSUAxFGsp6c";
  var o_ = "en";
  var url = "https://www.googleapis.com/language/translate/v2?key=" + apiKey + "&source=" + o_ + "&target=" + _o + "&q=" + encodeURI(str);
  var client = require("https");
  var urlset = require("url").parse(url);
  var options = {
    host: urlset.hostname,
    port: urlset.port,
    path: urlset.pathname + urlset.search
  };
  client.get(options, function (response) {
    var data = "";
    response.setEncoding("utf8");
    response.on("data", function (d) {
      data += d;
    });
    response.on("end", function () {
      var jsonData = JSON.parse(data);
      if (jsonData.error) {
        next(new Error(jsonData.error.message));
      } else {
        var translation = jsonData.data.translations[0].translatedText;
        next(null, {
          string: str,
          translation: translation
        });
      }
    });
  }).on("error", function (err) {
    next(err);
  });
};

exports.googleTranslate("family", "ko", function (err, o) {
  console.log(err, o);
});
