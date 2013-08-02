var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');

var wiki = require('./wiki');
var timeline = require('./timeline');

// very ugly and buggy
var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css",
  "json": "text/json"
};

var route = {};

// very ugly template variable object
// still trying to figure out better way
// guess what, it works!
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

function event_page(route, p, req, res) {
  var key = p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var jsonpath = '/wiki/'+key+'.json';
  var t = route.get('timeline');
  route.put('page_title', key);
  t.source = jsonpath;
  route.put('timeline', t);

  var have_cache = fs.existsSync('public/cache'+jsonpath);
  if(have_cache){
    route.end(res, 'timeline');
  }
  else{
    // preload to prevent timeout when first time we fetch from external source 
    var preload = 'http://' + req.headers.host + jsonpath;
    request(preload, function (error, response, data) {
      if(!error) { 
        route.end(res, 'timeline', data);
      }
    });
  }
}

function static_file(route, p, req, res) {
  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), 'public', uri);
  fs.exists(filename, function(exists) {
    if(!exists) {
      console.log("not exists: " + filename);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write('404 Not Found\n');
      res.end();
    }
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, mimeType);

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  });
}

function event_json(route, p, res, req) {
  var key = p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
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

function render_template(route, p, req, res) {
  var page = p.pathname.replace(/^\//, '').split('/').shift();
  route.put('page_name', page);
  route.put('pathname', p.pathname);
  route.end(res, page);
}

function render_frontpage(route, p, req, res) {
  var t = route.get('timeline');
  t.start_at_end = 'true';
  t.source = 'https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E&output=html';
  route.put('timeline', t);
  route.put('page_title', '怒政事件紀錄簿');
  route.put('is_front', 1);
  route.end(res, 'timeline');
}

route.run = function(req, res){
  route.params_default = this.params;
  var p = url.parse(decodeURIComponent(req.url));
  var t = this.get('timeline');
  t.start_at_end = 'false';
  this.put('is_front', 0);

  // see which path we need to follow
  var page = p.pathname.replace(/^\//, '').split('/').shift();
  var key = p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var ext = p.pathname.lastIndexOf('.') === -1 ? null : p.pathname.split('.').pop();

  // /wiki/OOO
  if(page == 'wiki' && !ext && key){
    event_page(this, p, req, res);
  }
  else
  // static file at public/
  if(ext && ext !== 'json'){
      static_file(route, p, req, res);
  }
  else
  // /wiki/OOO.json
  if(page == 'wiki' && ext === 'json'){
      event_json(route, p, res, req);
  // templates
  } else if (fs.existsSync('templates/'+page+'.ejs')) {
      render_template(route, p, req, res);
  }
  // frontpage
  else{
      render_frontpage(route, p, req, res);
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
