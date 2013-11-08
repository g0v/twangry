var request = require('request');
var fs = require('fs');
var config = require('config');

function category(){
  this.spreadsheet_uri = config.category._source;
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
      fs.writeFile('public/cache/category.json', JSON.stringify(navigation));
    }
  });
}

category.prototype.list = function(){
  if(fs.existsSync('public/cache/category.json')){
    return JSON.parse(fs.readFileSync('public/cache/category.json'));
  }
  else{
    this.request_json();
  }
}

module.exports = new category;
