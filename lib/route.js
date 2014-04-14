var nconf = require('nconf');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var mime = require('mime');

// library
var Template = require(nconf.get('base')+'/lib/template');
var utils = require(nconf.get('base')+'/lib/utils');
var timeline = require(nconf.get('base')+'/lib/timeline');

// module(sources)
var wikipedia = require(nconf.get('base')+'/mod/wikipedia');

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
  if(args[args.length-1].lastIndexOf('.') === -1){
    var ext = 'html';
  }
  else{
    args[args.length-1].lastIndexOf('.') === -1
    var ext = args[args.length-1].split('.').pop();
    args[args.length-1] = args[args.length-1].replace('.'+ext, '');
  }
  var mod = args[0];
  if(!mod){
    mod = 'index'; // frontpage
  }

  // override nconf to option
  var option = {};

  // 
  fs.exists('mod/'+mod+'.js', function(exists){
    if(exists){
      var page = require("../mod/" + mod);
      var tpl = new Template();

      // global params
      tpl.set('url', 'http://'+req.headers.host+req.url);
      tpl.set('base_url', 'http://'+req.headers.host);
      tpl.set('host', req.headers.host);
      tpl.set('template', mod);

      // prepare params
      var err = page.route(tpl, args, ext, option);

      // render template
      if(!err){
        if(!ext || ext == 'html' || ext == 'htm'){
          res.mimetype = 'text/html';
        }
        else if(ext == 'json'){
          res.mimetype = 'application/json';
        }
        else{
          res.mimetype = 'text/plain';
        }
        route.deliver(mod, tpl.export(), res);

        // release memory
        tpl = null;
        return;
      }
      else{
        console.log(err);
      }
    }
    route.deliver('error', null, res);
  });
}

route.deliver = function(type, params, res){
  // pipe static file directly
  if(type == 'static'){
    var filename = params; // params is filename
    fs.stat(filename, function(err, stat){
      var head = {"Content-Type":res.mimetype, "Content-Length":stat.size};
      res.writeHead(200, head);
      fs.createReadStream(filename, {'bufferSize': 64 * 1024}).pipe(res);
    });
  }
  else
  if(type !== 'error'){
    if(res.mimetype == 'application/json'){
      var head = {"Content-Type": res.mimetype};
      res.writeHead(200, head);
      res.end(params.json);
    }
    else{
      var filename = 'tpl/'+type+'.ejs';
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
  }
  else{
    res.writeHead(404);
    res.write("Not Found");
    res.end();
  }
}

module.exports = route;
