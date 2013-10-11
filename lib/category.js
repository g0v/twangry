var request = require('request');
var fs = require('fs');

function category(){
  this.spreadsheet_uri = 'https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E/od7/public/values?alt=json';
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
