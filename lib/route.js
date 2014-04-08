var request = require('request');
var cheerio = require('cheerio');
var nconf = require('nconf');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var director = require('director');
var moment = require('moment');
var mime = require('mime');

// library
var timeline = require(nconf.get('base')+'/lib/timeline');

// module(sources)
var wikipedia = require(nconf.get('base')+'/mod/wikipedia');
var g0v = require(nconf.get('base')+'/mod/g0v');

var sources = {
  'wikipedia': wikipedia,
  'g0v': g0v
};

function Route(req, res){
  this.req = req;
  this.res = res;
  this.params = {
    is_front: 0,
    meta_desc: '',
    logo: nconf.get('page:logo'),
    sitename: nconf.get('page:sitename'),
    page_title: nconf.get('page:sitename'),
    mission: nconf.get('page:mission'),
    fb_appid: nconf.get('page:fb_appid'),
    timeline: {
      start_at_end: false,
      start_zoom_adjust: 20
    }
  };
}

Route.prototype.run = function(){
  var uri = url.parse(decodeURIComponent(this.req.url)).pathname;

  // deliver static file directly, only when proxy not enabled
  if(!nconf.get('proxy')){
    var filename = path.join('pub', uri).replace(/\/+$/, '');
    var cache = filename.replace('pub/', 'pub/cache/');
    if(fs.existsSync(filename) && !fs.lstatSync(filename).isDirectory()){
      var mimetype = mime.lookup(filename);
      this.deliver('static', filename, mimetype);
      return;
    }
    else
    if(fs.existsSync(cache) && !fs.lstatSync(cache).isDirectory()){
      var mimetype = mime.lookup(cache);
      this.deliver('static', cache, mimetype);
      return;
    }
  }

  // dynamic render pages
  this.args = uri.replace(/^\/+|\/+$/g, '').split('/');
  this.ext = this.args[this.args.length-1].lastIndexOf('.') === -1 ? null : this.args[this.args.length-1].split('.').pop();
  this.mod = this.args[0];
  if(!this.mod){
    this.mod = 'index'; // frontpage
  }
  
  if(fs.existsSync('mod/'+this.mod+'.js')){
    var page = require("../mod/" + this.mod);
    page.route(this);
  }
  else{
    this.deliver('error');
  }
  
/*
  // custom router handling
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
*/
}

Route.prototype.async = function(func_name, callback){
  process.nextTick(function(){
    callback(func_name);
  });
};

Route.prototype.put = function(name, value){
  this.params[name] = value;
}

Route.prototype.get = function(name){
  return this.params[name];
}

Route.prototype.deliver = function(tpl, data, mime){
  // pipe static file directly
  var head;
  if(tpl == 'static'){
    var filename = data; // data is filename
    head = {"Content-Type": mime};
    this.res.writeHead(200, head);
    fs.createReadStream(filename).pipe(this.res);
  }
  else
  if(tpl !== 'json' && tpl !== 'error'){
    this.params.tpl = tpl;
    this.params.filename = 'tpl/'+tpl+'.ejs';
    this.params.template = tpl;
    var page = fs.readFileSync(this.params.filename, 'utf-8');
    html = ejs.render(page, this.params);
    head = {"Content-Type": mime};
    this.res.writeHead(200, head);
    this.res.end(html);
  }
  else{
    if(tpl == 'error'){
      this.res.writeHead(404);
      this.res.write("Not Found");
      this.res.end();
    }
    if(tpl == 'json') {
      head = {"Content-Type": "application/json"};
      this.res.writeHead(200, head);
      this.res.end(html);
    }
  }
}

function get_articles(key) {
  var articles = [];
  if(fs.existsSync('public/cache/index.json')){
    var json = fs.readFileSync('public/cache/index.json', 'utf-8');
    if(json){
      var wikiArticles = JSON.parse(json).wikiArticles;
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
  }
  return [];
}

function render_event_page(key) {
  var keys = get_articles(key);
  var jsonpath = '/wiki/'+keys.join('+')+'.json';
  var t = route.get('timeline');
  var preload = 'http://' + this.req.headers.host + jsonpath;
  var now = Date.now();
  var res = this.res;
  var req = this.req;
  route.put('page_title', key + ' - ' + nconf.get('page:sitename'));
  route.put('wiki_sources', get_articles(key));
  route.put('url', 'http://'+req.headers.host+req.url);
  t.source = preload;
  route.put('timeline', t);
  moment.lang('zh-tw');
  if(this.req.url.match(/start_at_end/i)){
    t.start_at_end = 'true';
  }

  // preload to prevent timeout when first time we fetch from external source 
  var ogimage, ogdescription = '';
  if(fs.existsSync('public/cache'+jsonpath)){
    var stats = fs.statSync('public/cache'+jsonpath);
    if(now - stats.mtime > 86400*2*1000){
      preload += '?nocache=1';
      route.put('mtime',  moment(now).fromNow());
    }
    else{
      route.put('mtime', moment(stats.mtime).fromNow());
      preload = null;
    }
    if(keys.length === 1){
      var data = fs.readFileSync('public/cache'+jsonpath);
      if(typeof(data) !== 'undefined' && data.length){
        var thejson = JSON.parse(data);
        if(thejson.timeline.text){
          ogdescription = thejson.timeline.text;
        }
        if(thejson.timeline.asset){
          ogimage = thejson.timeline.asset.media;
          if(ogimage.match(/(jpg|png|gif|jpeg)$/i)){
            ogimage = 'http:'+ogimage.replace(/^(https:|http:)/gi, '');
          }
          else{
            ogimage = '';
          }
        }
      }
    }
  }
  else{
    route.put('mtime',  moment(now).fromNow());
  }
  route.put('ogdescription', ogdescription);
  route.put('ogimage', ogimage);

  // preload the json
  if(preload){
    request(preload, function (error, response, data) {
      if(!error) { 
        route.deliver(res, 'timeline');
      }
    });
  }
  else{
    route.deliver(res, 'timeline');
  }
}

function render_event_json(key) {
  if(key.length > 64){
    route.deliver(res, 'error');
    return;
  }
  // XXX for functions later
  var res = this.res;
  var req = this.req;
  console.log('render_event_json %s',key);
  var timelines = [];
  json = JSON.parse(fs.readFileSync('public/cache/index.json'));
  if(json.wikiArticles[key]){
    key = json.wikiArticles[key].replace(',', '+');
  }
  key.split(/\+/).forEach(function (k) {
    var s = k.split(':', 2);
    if (s.length == 1) {
      // zh wikipedia is the default source
      wp(k).appendTimeline(timelines, req);
    } else {
      sources[s[0]](s[1]).appendTimeline(timelines, req);
    }
  });
  async.parallel(timelines,
    function endParallel(err, results) {
      if(err){
        route.deliver(res, 'error');
      }
      else{
        var error;
        results.forEach(function (tl) {
          if(tl.json){
            if (tl.json.timeline.headline !== null) {
              fs.writeFile('./public/cache/wiki/'+tl.json.timeline.headline+'.json', tl.exportjson());
            }
          }
          else{
            error = 1;
          }
        });
        if(error){
          route.deliver(res, 'error');
        }
        else{
          var entry = results.shift();
          results.forEach(function (tl) {
              entry.json.timeline.date = entry.json.timeline.date.concat(tl.json.timeline.date);
          });
          route.deliver(res, 'json', entry.exportjson(), {"Content-Type": "text/json"});
        }
      }
    }
  );
}

function render_template() {
  var page = this.p.pathname.replace(/^\//, '').split('/').shift();
  route.put('page_name', page);
  route.put('pathname', this.p.pathname);
  route.deliver(this.res, page);
}

function render_frontpage_json() {
  var filename = 'public/cache/index.json';
  if(fs.existsSync(filename) && !this.req.url.match('nocache=1')){
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    this.res.writeHead(200, mimeType);
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(this.res);
  }
  else{
    index.request_json(route, this.res);
  }
}

function render_seo(req, res){
  var base = 'http://i.jimmyhub.net/html/http://' + req.headers.host;
  if(req.url.match(/_escaped_fragment_=\/wiki\/[^\/]+$/)) {
    base += req.url;
  }
  request(base, function(error, response, data){
    if(!error) { 
      head = {"Content-Type": "text/html"};
      res.writeHead(200, head);
      res.end(data);
    }
  });
}

Route.prototype.watch = function(req){
  for (var src in sources) {
    if (sources[src]().updateCache) {
      setInterval(sources[src]().updateCache, 7200*1000);
    }
  }
  var p = url.parse(decodeURIComponent(req.url));

/* Unknown error when regular fetching index. Change to manually update.
  setInterval(function(){
    request(nconf.get('index:_source'), function (error, response, data) {
      if (!error && data) {
        // cached
        index.get_json(data);
      }
    });
  }, 600*1000);
*/
}

module.exports = Route;
