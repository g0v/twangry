var request = require('request');
var moment = require('moment');
var config = require('config');
var timeline = require('./timeline');
var fs = require('fs');

function index() {
  this.timeline = timeline();
  this.spreadsheet_uri = config.index._source;
}

index.prototype.get_json = function (data) {
   this.parseFront(data);
   var events = this.timeline.json.timeline;
   var json = JSON.stringify(events);
   fs.writeFile('./public/cache/index.json', json);
   return json;
}

index.prototype.request_json = function (route, res) {
  var idx = this;
  request(this.spreadsheet_uri, function (error, response, data) {
    if(!error){
      route.end(res, 'json', idx.get_json(data), {"Content-Type": "text/json"});
    }
  });
}

index.prototype.parseFront = function(data){
  this.timeline = timeline();
  var json = JSON.parse(data).feed.entry;
  var years = {};
  var tags = {};
  var wikiArticles = {};
  var thisindex = this;
  json.forEach(function(d){
    var asset = thisindex.timeline.asset(d['gsx$media'].$t, d['gsx$mediacredit'].$t, d['gsx$mediacaption'].$t);
    var revision;
    if(d['gsx$revision'].$t){
      revision = d['gsx$revision'].$t;
    }
    var date = moment(d['gsx$startdate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY", "MM/YYYY", "M/YYYY", "YYYY"]);
    var startDate = date.format('YYYY/M/D');
    var endDate = '';
    var timestamp = '';
    if(d['gsx$enddate'].$t){
      var ddate = moment(d['gsx$enddate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY", "YYYY/MM", "YYYY/M", "YYYY"]);
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
    var a = d['gsx$wikiarticle'].$t;
    if (!a) {
      wikiArticles[d['gsx$headline'].$t] = d['gsx$headline'].$t;
    }
    else {
      wikiArticles[d['gsx$headline'].$t] = a;
    }
    thisindex.timeline.setDate(startDate, endDate, d['gsx$headline'].$t, d['gsx$text'].$t, asset, t, timestamp, revision);
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
  thisindex.timeline.set('tags', tags);
  thisindex.timeline.set('years', sorted_years);
  thisindex.timeline.set('wikiArticles', wikiArticles);
}
module.exports = new index;
