var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var director = require('director');
var moment = require('moment');

var wiki = require('./wiki');
var timeline = require('./timeline');

// very ugly and buggy
var mimeTypes = {
  "html": "text/html",
  "txt": "text/plain",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css",
  "json": "text/json"
};

var route = {};

var director_routes = {
  '/': {
    get: render_frontpage
  },
  '/index.json': {
    get: render_frontpage_json
  },
  '/wiki': {
    '/([^\.]+)$': {
      get: render_event_page
    },
    '/(.*)\.json$': {
      get: render_event_json
    }
  },
  '/(compiled|js|css)\/(.*)\.(\\w+)': {
    get: dump_static_file
  },
  '/(\\w+)\.(\\w+)': {
    get: dump_static_file
  }
};

var director_router = new director.http.Router(director_routes).configure({
//  'notfound': render_template // remove by jimmy because it will cause exit code when file not found.
});
director_router.attach(function () {
  this.p = url.parse(decodeURIComponent(this.req.url));
});

// very ugly template variable object
// still trying to figure out better way
// guess what, it works!
route.params = {
  is_front: 0,
  header_title: '政誌',
  meta_desc: '',
  page_title: '政誌',
  mission: '勿忘政治',
  timeline: {
    source: 'https://docs.google.com/spreadsheet/pub?key=0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E&output=html',
    start_at_end: false,
    start_zoom_adjust: 20
  }
};

function render_event_page() {
  var key = this.p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var jsonpath = '/wiki/'+key+'.json';
  var t = route.get('timeline');
  route.put('page_title', key);
  t.source = jsonpath;
  route.put('timeline', t);
  moment.lang('zh-tw');

  if(fs.existsSync('public/cache'+jsonpath)) {
    var stats = fs.statSync('public/cache'+jsonpath);
    route.put('mtime', moment(stats.mtime).fromNow());
    route.end(this.res, 'timeline');
  }
  else{
    // preload to prevent timeout when first time we fetch from external source 
    var date = new Date;
    route.put('mtime', moment(date).fromNow());
    var preload = 'http://' + this.req.headers.host + jsonpath;
    // XXX for functions later
    var res = this.res;
    request(preload, function (error, response, data) {
      if(!error) { 
        route.end(res, 'timeline', data);
      }
    });
  }
}

function dump_static_file() {
  var uri = url.parse(this.req.url).pathname;
  var filename = path.join(process.cwd(), 'public', uri);
  // XXX for functions later
  var res = this.res;
  if(fs.existsSync(filename)){
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, mimeType);

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(this.res);
  }
  else{
    res.writeHead(404);
    res.end();
  }
}

function render_event_json(key) {
  // XXX for functions later
  var res = this.res;
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
      route.end(res, 'error');
    }
    else{
      var json = timeline.exportjson();
      fs.writeFile('./public/cache/wiki/'+key+'.json', json);
      route.end(res, 'json', json, {"Content-Type": "text/json"});
    }
  });
}

function render_template() {
  var page = this.p.pathname.replace(/^\//, '').split('/').shift();
  route.put('page_name', page);
  route.put('pathname', this.p.pathname);
  route.end(this.res, page);
}

function render_frontpage() {
  route.put('page_title', '政誌');
  route.put('is_front', 1);
  route.end(this.res, 'index');
}

function render_frontpage_json() {
  timeline.init();
  var uri = 'https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E/od6/public/values?alt=json';
  // XXX for functions later
  var res = this.res;
  request(uri, function(error, response, data){
    if(!error){
      var index = require('./index');
      index.parseFront(data);
      var events = timeline.json.timeline;
      route.end(res, 'json', JSON.stringify(events), {"Content-Type": "text/json"});
    }
  });
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

  director_router.dispatch(req, res, function (err) {
    if (err) {
      res.writeHead(404);
      res.end();
    }
  });
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

route.watch = function(){
  var interval = 900*1000;
  setInterval(wiki.updateArticle, interval);
}

module.exports = route;
