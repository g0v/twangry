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
    var startDate = date.format('YYYY/M/D');
    var endDate = '';
    var timestamp = '';
    if(d['gsx$enddate'].$t){
      var ddate = moment(d['gsx$enddate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY"]);
      endDate = ddate.format('YYYY/M/D');
    }
    if(endDate){
      timestamp = ddate.unix();
    }
    else{
      timestamp = date.unix();
    }
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
    timeline.setDate(startDate, endDate, d['gsx$headline'].$t, d['gsx$text'].$t, asset, t, timestamp);
  });
  var sorted_years = [];
  var k;
  for(k in years){
    if (years.hasOwnProperty(k)){
      sorted_years.push(k);
    }
  }
  sorted_years.sort();
  sorted_years.reverse();
  timeline.set('tags', tags);
  timeline.set('years', sorted_years);
}
module.exports = index;
