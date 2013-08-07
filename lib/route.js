var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var director = require('director');

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
    '/(\\w+)\.(\\w+)': {
        get: dump_static_file
    },
    '/wiki': {
        '/(.+)$': {
            get: render_event_page
        },
        '/(\\w+)\.json$': {
            get: render_event_json
        }
    }
};

var director_router = new director.http.Router(director_routes).configure({
    'notfound': render_template
});
director_router.attach(function () {
    this.route = route;
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
    start_zoom_adjust: 1
  }
};

function render_event_page() {
  var key = this.p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var jsonpath = '/wiki/'+key+'.json';
  var t = this.route.get('timeline');
  this.route.put('page_title', key);
  t.source = jsonpath;
  this.route.put('timeline', t);

  var stats = fs.statSync('public/cache'+jsonpath);
  if(stats){
    this.route.put('mtime', stats.mtime.toLocaleDateString()+' '+stats.mtime.toLocaleTimeString());
    this.route.end(this.res, 'timeline');
  }
  else{
    // preload to prevent timeout when first time we fetch from external source 
    var date = new Date;
    this.route.put('mtime', date.toLocaleDateString()+' '+date.toLocaleTimeString());
    var preload = 'http://' + this.req.headers.host + jsonpath;
    request(preload, function (error, response, data) {
      if(!error) { 
        this.route.end(this.res, 'timeline', data);
      }
    });
  }
}

function dump_static_file(route, p, req, res) {
  var uri = url.parse(this.req.url).pathname;
  var filename = path.join(process.cwd(), 'public', uri);
  fs.exists(filename, function(exists) {
    if(!exists) {
      console.log("not exists: " + filename);
      this.res.writeHead(200, {'Content-Type': 'text/plain'});
      this.res.write('404 Not Found\n');
      this.res.end();
    }
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    this.res.writeHead(200, mimeType);

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(this.res);
  });
}

function render_event_json() {
  var key = this.p.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
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
      this.end(this.res, 'error');
    }
    else{
      var json = timeline.exportjson();
      fs.writeFile('./public/cache/wiki/'+key+'.json', json);
      route.end(this.res, 'json', json, {"Content-Type": "text/json"});
    }
  });
}

function render_template() {
  var page = this.p.pathname.replace(/^\//, '').split('/').shift();
  this.route.put('page_name', page);
  this.route.put('pathname', this.p.pathname);
  this.route.end(this.res, page);
}

function render_frontpage() {
  this.route.put('page_title', '政誌');
  this.route.put('is_front', 1);
  this.route.end(this.res, 'index');
}

function render_frontpage_json() {
  timeline.init();
  var uri = 'https://spreadsheets.google.com/feeds/list/0AuwTztKH2tKidGZ2cEdVY19PZEpzRWVJWWZOeUI1Y0E/od6/public/values?alt=json';
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
          res.writeHead(200);
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
  setInterval(wiki.updateArticle, 3600*1000);
}

module.exports = route;
