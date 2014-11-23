var request = require('request');
var moment = require('moment');
var nconf = require('nconf');

// local library
var Timeline = require(nconf.get('base')+'/lib/timeline');
var fs = require('fs');

/**
 * Constructor
 */
var index = {};

/**
 * Page route of this module
 */


index.route = function(tpl, args, ext, callback){
  var nav = fs.readFileSync('pub/cache/category.json', 'utf-8');
  tpl.set('nav', JSON.parse(nav));
  tpl.set('page_title', nconf.get('page:sitename') + ' | ' + nconf.get('page:mission'));
  tpl.set('ogdescription', nconf.get('page:mission'));
  tpl.set('ogimage', nconf.get('page:logo'));
  tpl.set('is_front', 1);
  callback();
}


index.get_json = function (data) {
  this.timeline = new Timeline();
  this.spreadsheet_uri = nconf.get('index:source');
  console.log(this);
  this.parseFront(data);
  console.log(this.timeline);
  var events = this.timeline.json.timeline;
  var json = JSON.stringify(events);
  fs.writeFile('./pub/cache/index.json', json);
  return json;
}

index.request_json = function (route, res) {
  this.timeline = new Timeline();
  this.spreadsheet_uri = nconf.get('index:source');
  var idx = this;
  request(this.spreadsheet_uri, function (error, response, data) {
    if(!error){
      route.end(res, 'json', idx.get_json(data), {"Content-Type": "text/json"});
    }
  });
}

index.parseFront = function(data){
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
module.exports = index;
