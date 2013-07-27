var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var fs = require('fs');
var ejs = require('ejs');

var wiki = require('./wiki');
var timeline = require('./timeline');

var route = {};
route.params = {
  is_front: 0,
  header_title: '怒政事件紀錄簿',
  meta_desc: '',
  page_title: '怒政事件紀錄簿',
  mission: '那些年，我們一起憤怒的政客、政策、政績 ...',
  timeline: {
    source: 'https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E&output=html',
    start_at_end: false,
    start_zoom_adjust: 1
  }
};

route.run = function(req, res){
  route.params_default = this.params;
  var path = url.parse(decodeURIComponent(req.url));
  var t = this.get('timeline');
  t.start_at_end = 'false';
  this.put('is_front', 0);

  // see which path we need to follow
  // we suppose all the data format is json
  // var arg0 = path.pathname.match(/^\/[^\/]+/); // not use this yet
  var key = path.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var ext = path.pathname.lastIndexOf('.') === -1 ? null : path.pathname.split('.').pop();

  if(!ext && key){
    var jsonpath = '/wiki/'+key+'.json';
    this.put('page_title', key);
    t.source = jsonpath;
    this.put('timeline', t);

    var have_cache = fs.existsSync('public/cache'+jsonpath);
    if(have_cache){
      this.end(res, 'timeline');
    }
    else{
      var preload = 'http://' + req.headers.host + jsonpath;
      request(preload, function (error, response, data) {
        if(!error) { 
          route.end(res, 'timeline', data);
        }
      });
    }
  }
  else
  if(ext === 'json'){
    timeline.init();
    async.parallel({
      w: function wr(callback){
        wiki.request(key, callback);
      },
      wcoord: function wc(callback){
        setTimeout(function wrt(){
          wiki.requestCoord(key, callback);
        }, 500);
      }
      /*
      ,
      f: function fr(flickr.request){
        setTimeout(function frt(){
          flickr.request(path.pathname);
        }, 300);
      }
      */
    },
    function endParallel(err, results) {
      if(err){
        this.end(res, 'error');
      }
      else{
        var json = timeline.exportjson();
        fs.writeFile('./public/cache/wiki/'+key+'.json', json);
        route.end(res, 'json', json, {"Content-Type": "text/json"});
      }
    });
  }
  else{
    t.start_at_end = 'true';
    t.source = 'https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E&output=html';
    this.put('timeline', t);
    this.put('page_title', '怒政事件紀錄簿');
    this.put('is_front', 1);
    this.end(res, 'timeline');
  }
}

route.put = function(name, value){
  route.params[name] = value;
}
route.get = function(name){
  return route.params[name];
}
route.end = function(res, template, html, head){
  if(template !== 'json'){
    var page = fs.readFileSync('templates/'+template+'.ejs', 'utf-8');
    var html = ejs.render(page, this.params);
  }
  if(!head){
    head = {"Content-Type": "text/html"};
  }
  res.writeHead(200, head);
  res.end(html);
}
module.exports = route;
