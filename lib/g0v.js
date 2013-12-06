
var timeline = require('./timeline');
var moment = require('moment');
var request = require('request');

var cacheBin = exports.cacheBin = 'g0v';

function G0VChronology(key) {
  if (key === 'chronology') {
    this.spreadsheet_uri = 'https://spreadsheets.google.com/feeds/list/0AuVVq3srA7dPdFQtc3VQOUg0U1FZaVRYX09VeUMyU2c/od6/public/values?alt=json';
    this.cacheBin = cacheBin;
    this.cachePath = 'public/cache/' + cacheBin + '/chronology.json';
  } else if (key !== undefined) {
    console.error("G0VChronology: unknown key '%s'.", key);
  }
}

function get(key) {
  return new G0VChronology(key);
}

G0VChronology.prototype.parseGoogleSpreadsheet = function (data, callback) {
  var tl = timeline();
  var json = JSON.parse(data).feed.entry;
  var years = {};
  var tags = {};
  json.forEach(function(d){
    var asset = tl.asset(d['gsx$media'].$t, d['gsx$mediacredit'].$t, d['gsx$mediacaption'].$t);
    var date = moment(d['gsx$startdate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY", "MM/YYYY", "M/YYYY", "YYYY"]);
    var startDate = date.format('YYYY,M,D');
    var endDate = '';
    var timestamp = '';
    if(d['gsx$enddate'].$t){
      var ddate = moment(d['gsx$enddate'].$t, ["M/D/YYYY","MM/DD/YYYY","YYYY/M/D","YYYY/MM/DD","DD/MM/YYYY","D/M/YYYY", "YYYY/MM", "YYYY/M", "YYYY"]);
      endDate = ddate.format('YYYY,M,D');
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
    tl.setDate(startDate, endDate, d['gsx$headline'].$t, d['gsx$text'].$t, asset, t, timestamp);
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
  tl.set('tags', tags);
  tl.set('years', sorted_years);

  callback(null, tl);
}

G0VChronology.prototype.request = function (callback) {
  var g = this;
  request(this.spreadsheet_uri, function (err, res, data) {
    if (err) {
      callback(true);
    } else {
      g.parseGoogleSpreadsheet(data, callback);
    }
  });
}

G0VChronology.prototype.appendTimeline = function (timelines) {
  var g = this;
  timelines.push(function (callback) {
    g.request(callback);
  });
}

exports.get = get;
