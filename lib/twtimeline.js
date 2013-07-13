var fs = require('fs');
var twtimeline = {};

twtimeline.content = function(query) {
  var source = fs.readFileSync('page.tpl', 'utf-8').replace();
  return source.replace('example_json.json', 'wiki/2009年8月.json');
}

module.exports = twtimeline;
