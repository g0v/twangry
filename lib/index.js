var request = require('request');
var moment = require('moment');
var timeline = require('./timeline');

var index = {};

index.parseFront = function(data){
  var json = JSON.parse(data).feed.entry;
  var years = {};
  var tags = {};
  json.forEach(function(d){
    var asset = timeline.asset(d['gsx$media'].$t, d['gsx$mediacredit'].$t, d['gsx$mediacaption'].$t);
    var date = moment(d['gsx$startdate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY"]);
    var year = date.year();
    if(!(year in years)){
      years[year] = year;
    }
    var t = d['gsx$tag'].$t.split(',');
    t.forEach(function(tt){
      tt = tt.replace(/(^\s*)|(\s*$)/g, "");
      if(!(tt in tags)){
        tags[tt] = tt;
      }    
    });
    timeline.setDate(d['gsx$startdate'].$t, d['gsx$enddate'].$t, d['gsx$headline'].$t, d['gsx$text'].$t, asset, d['gsx$tag'].$t, date.unix());
  });
  timeline.set('tags', tags);
  timeline.set('years', years);
}
module.exports = index;
