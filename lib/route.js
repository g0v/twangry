var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var director = require('director');
var moment = require('moment');
var index = require('./index');

var wp = require('./wikipedia');
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

var sources = {
  'wikipedia': wp
};

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

function get_articles(key) {
  var articles = [];
  var wikiArticles = JSON.parse(fs.readFileSync('public/cache/index.json', 'utf-8')).wikiArticles;
  key.split('+').forEach(function (k) {
    if (wikiArticles[k]) {
      articles = articles.concat(wikiArticles[k].split(','));
    }
    else {
      articles.push(k);
    }
  });
  return articles;
}

function render_event_page(key) {
  var jsonpath = '/wiki/'+get_articles(key).join('+')+'.json';
  var t = route.get('timeline');
  var preload = 'http://' + this.req.headers.host + jsonpath;
  route.put('page_title', key);
  t.source = preload;
  route.put('timeline', t);
  moment.lang('zh-tw');

  // preload to prevent timeout when first time we fetch from external source 
  var date = new Date;
  route.put('mtime', moment(date).fromNow());
  // XXX for functions later
  var res = this.res;
  request(preload, function (error, response, data) {
    if(!error) { 
      route.end(res, 'timeline', data);
    }
  });
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
  var timelines = [];
  key.split(/\+/).forEach(function (k) {
    var s = k.split(':', 1);
    if (s.length == 1) {
      // zh wikipedia is the default source
      wp(k).appendTimeline(timelines);
    } else {
      sources[s[0]](s[1]).appendTimeline(timelines);
    }
  });
  async.parallel(timelines,
    function endParallel(err, results) {
      if(err){
        route.end(res, 'error');
      }
      else{
        results.forEach(function (tl) {
          if (tl.json.timeline.headline !== null) {
            fs.writeFile('./public/cache/wiki/'+tl.json.timeline.headline+'.json', tl.exportjson());
          }
        });
        var entry = results.shift();
        results.forEach(function (tl) {
            entry.json.timeline.date = entry.json.timeline.date.concat(tl.json.timeline.date);
        });
        route.end(res, 'json', entry.exportjson(), {"Content-Type": "text/json"});
      }
    }
  );
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
  index.request_json(route, this.res);
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
  setInterval(wp().updateCache, 900*1000);
  setInterval(function(){
    request('http://fact.g0v.tw/index.json?nocache=1');
  }, 199*1000);
}

module.exports = route;
