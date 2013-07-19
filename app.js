var http = require('http');
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var async = require('async');

var wiki = require('./lib/wiki');
var timeline = require('./lib/timeline');

var server = http.createServer(function(req, res){
  // block error request first
  var path = url.parse(decodeURIComponent(req.url));

  // request handling
  if(req.method === 'POST'){
    serverError(404, '404 Bad Request');
  }

  // see which path we need to follow
  // we suppose all the data format is json
  // var arg0 = path.pathname.match(/^\/[^\/]+/); // not use this yet
  var key = path.pathname.replace(/^\/[^\/]+\/|\.[^\/]+$/g, '').replace('/','');
  var ext = path.pathname.lastIndexOf('.') === -1 ? null : path.pathname.split('.').pop();

  if(!ext && key){
    var source = fs.readFileSync('./page.tpl', 'utf-8');
    var jsonpath = '/wiki/'+key+'.json';
    var html = source.replace('example_json.json', jsonpath);
    var have_cache = fs.existsSync('public/cache'+jsonpath);

    if(have_cache){
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(html);
    }
    else{
      var preload = 'http://' + req.headers.host + jsonpath;
      request(preload, function (error, response, data) {
        if(!error) { 
          res.writeHead(200, {"Content-Type": "text/html"});
          res.end(html);
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
        res.writeHead(501, {'Content-Type': 'text/plain'});
        res.end('Request problem');
      }
      else{
        var json = timeline.exportjson();
        fs.writeFile('./public/cache/wiki/'+key+'.json', json);
        res.write(json, 'utf8');
        res.end();
      }
    });
  }
  else{
    var source = fs.readFileSync('./page.tpl', 'utf-8');
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(source);
  }
});

server.listen(6666);
