var request = require('request');
var fs = require('fs');
var nconf = require('nconf');

function category(){
  this.spreadsheet_uri = nconf.get('category:source');
}

category.prototype.request_json = function(){
  request(this.spreadsheet_uri, function (error, response, data) {
    if(!error){
      var json = JSON.parse(data).feed.entry;
      var navigation = [];
      json.forEach(function(d){
        var primary = d['gsx$primary'].$t;
        var secondary = d['gsx$secondary'].$t;
        secondary = secondary.split(',');
        var nav = {};
        nav[primary] = secondary;
        navigation.push(nav);
      });
      fs.writeFile('pub/cache/category.json', JSON.stringify(navigation));
    }
  });
}

category.prototype.list = function(){
  if(fs.existsSync('pub/cache/category.json')){
    return JSON.parse(fs.readFileSync('pub/cache/category.json'));
  }
  else{
    this.request_json();
  }
}

module.exports = new category;
