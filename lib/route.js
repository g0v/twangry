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

var route = {};

route.run = function(req, res){
  var uri = url.parse(decodeURIComponent(req.url)).pathname;

  // deliver static file directly, only when proxy not enabled
  if(!nconf.get('proxy')){
    var filename = path.join('pub', uri).replace(/\/+$/, '');
    var cache = filename.replace('pub/', 'pub/cache/');
    if(fs.existsSync(filename) && !fs.lstatSync(filename).isDirectory()){
      res.mimetype = mime.lookup(filename);
      route.deliver('static', filename, res);
      return;
    }
    else
    if(fs.existsSync(cache) && !fs.lstatSync(cache).isDirectory()){
      res.mimetype = mime.lookup(cache);
      route.deliver('static', cache, res);
      return;
    }
  }

  // dynamic render pages
  var args = uri.replace(/^\/+|\/+$/g, '').split('/');
  var ext = args[args.length-1].lastIndexOf('.') === -1 ? null : args[args.length-1].split('.').pop();
  var mod = args[0];
  if(!mod){
    mod = 'index'; // frontpage
  }

  fs.exists('mod/'+mod+'.js', function(exists){
    if(exists){
      var page = require("../mod/" + mod);
      var Template = require(nconf.get('base')+'/lib/template');
      var tpl = new Template();

      // global params
      tpl.put('url', 'http://'+req.headers.host+req.url);
      tpl.put('template', mod);

      // prepare params
      page.route(tpl);

      // render template
      res.mimetype = 'text/html';
      route.deliver(mod, tpl.export(), res);

      // release memory
      tpl = null;
    }
    else{
      route.deliver('error', null, res);
    }
  });
}

route.deliver = function(tpl, params, res){
  // pipe static file directly
  if(tpl == 'static'){
    var filename = params; // params is filename
    fs.stat(filename, function(err, stat){
      var head = {"Content-Type":res.mimetype, "Content-Length":stat.size};
      res.writeHead(200, head);
      fs.createReadStream(filename, {'bufferSize': 64 * 1024}).pipe(res);
    });
  }
  else
  if(tpl !== 'json' && tpl !== 'error'){
    var filename = 'tpl/'+tpl+'.ejs';
    fs.readFile(filename, 'utf-8', function(err, data){
      if (err){
        res.writeHead(404);
        res.write("Not Found");
        res.end();
      }
      else{
        params.filename = filename;
        var html = ejs.render(data, params);
        var head = {"Content-Type": res.mimetype};
        res.writeHead(200, head);
        res.end(html);
      }
    });
  }
  else{
    if(tpl == 'error'){
      res.writeHead(404);
      res.write("Not Found");
      res.end();
    }
    if(tpl == 'json') {
      var head = {"Content-Type": "application/json"};
      res.writeHead(200, head);
      res.end(html);
    }
  }
}

route.watch = function(req){
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

module.exports = route;
