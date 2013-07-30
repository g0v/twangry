var request = require('request');
var moment = require('moment');
var timeline = require('./timeline');

var index = {};

index.parseFront = function(data){
  var json = JSON.parse(data).feed.entry;

  json.forEach(function(d){
    var asset = timeline.asset(d['gsx$media'].$t, d['gsx$mediacredit'].$t, d['gsx$mediacaption'].$t);
    timeline.setDate(d['gsx$startdate'].$t, d['gsx$enddate'].$t, d['gsx$headline'].$t, d['gsx$text'].$t, asset, d['gsx$tag'].$t);
  });
}
module.exports = index;
