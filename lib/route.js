var request = require('request');
var cheerio = require('cheerio');
var config = require('config');
var async = require('async');
var url = require('url');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var director = require('director');
var moment = require('moment');
var index = require('./index');

var timeline = require('./timeline');
var Firebase = require('firebase');
var nodemailer = require('nodemailer');
var http = require('http');
http.globalAgent.maxSockets = 5000;

// sources
var wp = require('./wikipedia');
var g0v = require('./g0v');

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
  'wikipedia': wp,
  'g0v': g0v
};

var director_routes = {
  '/': {
    get: render_frontpage
  },
  '/index.json': {
    get: render_frontpage_json
  },
  '/updateSubscribe': {
	 '/([^\.]+)$': {  
	   get: updateSubscribeTest
	 }  
  },
  '/updateWikiRev': {
	 '/([^\.]+)$': {  
	   get: updateWikiRev
	 }  
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
  meta_desc: '',
  logo: config.page.logo,
  sitename: config.page.sitename,
  page_title: config.page.sitename,
  mission: config.page.mission,
  fb_appid: config.page.fb_appid,
  timeline: {
    start_at_end: false,
    start_zoom_adjust: 20
  }
};

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
  route.put('page_title', key + ' - ' + config.page.sitename);
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
        route.end(res, 'timeline');
      }
    });
  }
  else{
    route.end(res, 'timeline');
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
        route.end(res, 'error');
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
          route.end(res, 'error');
        }
        else{
          var entry = results.shift();
          results.forEach(function (tl) {
              entry.json.timeline.date = entry.json.timeline.date.concat(tl.json.timeline.date);
          });
          route.end(res, 'json', entry.exportjson(), {"Content-Type": "text/json"});
        }
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
  // skip seo
  if(this.req.url.match(/\?_escaped_fragment_/)){
    render_seo(this.req, this.res);
    return;
  }
  var nav = fs.readFileSync('public/cache/category.json', 'utf-8');
  route.put('nav', JSON.parse(nav));
  route.put('page_title', config.page.sitename + ' | ' + config.page.mission);
  route.put('ogdescription', config.page.mission);
  route.put('ogimage', config.page.logo);
  route.put('is_front', 1);
  route.put('url', 'http://'+this.req.headers.host+this.req.url);
  route.end(this.res, 'index');
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

function parseComparePage(html){
  var $ = cheerio.load(html);
  
  $('table.diff.diff-contentalign-left').each(function() {
	 console.log("parseComparePage: I found one ",$(this).text());
	 return $(this).text();
  });
}

function sendEmail(emailAddress,title,html) {
    // Prepare nodemailer transport object
    var transport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
        user: "reporteroffact@gmail.com",
        pass: "twangery"
      }
    });
	
	var mailtitle='[政誌]'+title+'更新通知';
    transport.sendMail({
        from: 'fact.g0v <reporteroffact@gmail.com>',
        to: emailAddress,
        subject: mailtitle,
        html: html,
		text: html
      }, function(err, responseStatus) {
        if (err) {
          console.log(err);
        } else {
          console.log(responseStatus.message);
        }
      });
}

function updateWikiRev(key) {
  
  var res = this.res;
  var req = this.req;

  //query revision
  var wikiKey= get_articles(key);
  var WikiNewRegQuery='http://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids&format=json&titles='+wikiKey[0];
  console.log(WikiNewRegQuery);
  request(WikiNewRegQuery, function (error, response, data) {
    if(error) { 
      console.log("revQuery fail");
      res.writeHead(404);
      res.end('not Found');
    }
    else{
	  var result=JSON.parse(data);
	  var pageNum=Object.keys(result['query']['pages']);
	  var rev=result['query']['pages'][pageNum]['revisions'][0]['revid'];
	  console.log("rev=%s",rev); 
	  var revQuery= 'https://twangrytest.firebaseio.com/subscribe/'+key;
	  var ref=new Firebase(revQuery);
	  ref.once('value', function(snapshot) {
	    if(snapshot.val()==null) {
	  	  res.writeHead(404);
	  	  res.end('not Found');
		}
		else{
		  var email=snapshot.child('email').val();
		  var title=snapshot.child('title').val();
		  ref.set({title:title, email:email, revision:rev}, function(error) {
		    if (error) {			
			  console.log("updateWikiRev to firebase fail");
			  ref.off();	
			  res.writeHead(200, 'text/json');
			  res.end('update rev fail'); 
		    } else {
			  ref.off();
			  res.writeHead(200, 'text/json');
			  res.end('update rev success');	 
		    }
		  });//setRev request
		}//queryRev else		
	  });//queryRev request	 
    }//WikiNewRev else
  });//WikiNewRev request
 
  watchSubscribe();
}

function updateSubscribeTest(key) {
  var res = this.res;
  var req = this.req;
  
  //query email from firebase
  var subkey=key.substr(1,key.length-2);
  console.log("updateSubscribe title=%s",subkey);
 
  //query revision
  var wikiKey= get_articles(subkey);
  var WikiNewRevQuery='http://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids&format=json&titles='+wikiKey;
  console.log("updateSubscribe:QueryRev %s",WikiNewRevQuery);
  request(WikiNewRevQuery, function (error, response, data) {
    if(error) { 
      console.log("%s updateSubscribe:revQuery fail", key);
  	  res.writeHead(404);
  	  res.end('updateSubscribe:revQuery fail');
    }
    else{
	  var result=JSON.parse(data);
	  var pageNum=Object.keys(result['query']['pages']);
	  console.log("%s updateSubscribe:rev result=%s",key, data); 
	  var rev=result['query']['pages'][pageNum]['revisions'][0]['revid'];
	  console.log("%s updateSubscribe:rev=%s",key, rev);  
  	
	  //query Rev from firebase
      var RevQuery= 'https://twangrytest.firebaseio.com/subscribe/'+subkey;
      var ref=new Firebase(RevQuery);
      ref.once('value', function(snapshot) {
        if(snapshot.val()==null) {
	      res.writeHead(404);
	      res.end('updateSubscribe:QueryRev from firebase fail');
  	    } 	
    	else{
    	  var currentRev=snapshot.child('revision').val();
  		  console.log("%s Query Rev from firebase=%s",key, currentRev);
		
  		  if(rev==currentRev){
		    res.writeHead(200, 'text/json');
			res.end('There is no update');	 
  		  }
		  else if(currentRev==0){
		    //update newest rev
			var email=snapshot.child('email').val();
			var title=snapshot.child('title').val();
		  	ref.set({title:title, email:email, revision:rev}, function(error) {
		  	  if (error) {			
		  	    console.log("%s updateWikiRev to firebase fail", key);
		  	  }
			  else {
		  		console.log("%s updateWikiRev to firebase success", key);
		  	  }
		  	});
		  }
  		  else{
  			//compare 2 revision
  			var RevCompare='https://zh.wikipedia.org/w/index.php?action=render&diff='+rev+'&oldid='+currentRev+'&title='+subkey;
  			console.log(RevCompare);
  		    request(RevCompare, function (error, response, data) {
  		      if(error) { 
			    res.writeHead(404);
			    res.end('updateSubscribe:Get RevCompare fail');
  		      }
  		      else{  
  				console.log("parseComparePage start");  
	 	 		var $ = cheerio.load(data); 
	  			var updateHtml=$('table.diff.diff-contentalign-left').html();
				
  				//update newest rev
  				var email=snapshot.child('email').val();
  				var title=snapshot.child('title').val();
  		  	    ref.set({title:title, email:email, revision:rev}, function(error) {
  		  	      if (error) {			
  		  		    console.log("%s updateWikiRev to firebase fail", key);
  		  	      }else {
  		  		    console.log("%s updateWikiRev to firebase success", key);
  		  	      }
  		  	    });
  				//send email
  				console.log("%s sendEmail Start",key);  
  		  	    var mailArray=email.split(',');
  		  	  	mailArray.forEach(function(mailAddress){
  		  	  		sendEmail(mailAddress, subkey, updateHtml);
  		  	  	});
				
			    res.writeHead(200, 'text/json');
				res.end('update complete');	 
  		      }//RevCompare else
  			});//RevCompare request  
  		  }//there is update else
    	}//QueryRev from firebase else		
      });//QueryRev from filebase request	
    }//WikiNewRevQuery else
  });//WikiNewRevQuery request
}

function updateSubscribe(key) {
  var subkey=key;
  
  console.log('updateSubscribeTest',key);
  //query revision
  var wikiKey= get_articles(subkey);
  var WikiQuery='/w/api.php?action=query&prop=revisions&rvprop=ids&format=json&titles='+wikiKey;
  var options = {
    host : 'zh.wikipedia.org',
  	path : WikiQuery,
  	method: 'GET'
  };
  //var WikiNewRevQuery='http://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids&format=json&titles='+wikiKey;
  var request = http.request(options, function(res) {
    res.on('data', function(data) {
  	  result=JSON.parse(data);
      //console.log("%s updateSubscribe:rev result=%s",key, data); 
	 	   
	  var pageNum=Object.keys(result['query']['pages']);
	  if(pageNum==-1){
	    //console.log("%s updateSubscribe:revQuery fail",key); 
	  }
	  else{
	   	var rev=result['query']['pages'][pageNum]['revisions'][0]['revid'];
	    //console.log("%s updateSubscribe:rev=%s",key, rev);  
	    var needtoupdateRev=false;
		var email='';
	    var currentRev=0;
			 
	    //query Rev from firebase
	    var RevQuery= 'https://twangrytest.firebaseio.com/subscribe/'+subkey;
	    var ref=new Firebase(RevQuery);  
	    ref.once('value', function(snapshot) {
	      if(snapshot.val()==null) {
			
	      }
	      else{
	        currentRev=snapshot.child('revision').val();
		    email=snapshot.child('email').val();	 	 
	     
	        if(rev==currentRev){
		      console.log("%s no update",key);  
	        }
		    else if(currentRev==0){
	          ref.set({title:key, email:email, revision:rev}, function(error) {
	            if (error) {			
	      	      console.log("%s updateWikiRev to firebase fail", key);
	            }
	      	    else {
	      		  console.log("%s updateWikiRev to firebase success", key);
	      	    }
	          });	   	 	
		    }
		    else{
		      //compare 2 revision
		      var CompareQuery='/w/index.php?action=render&diff='+rev+'&oldid='+currentRev+'&title='+subkey;
			  var Compareoptions = {
		        host : 'zh.wikipedia.org',
			    path : CompareQuery,
			    method: 'GET'
		      };
					
			  var compareresult='';
			  var comparerequest = http.request(Compareoptions, function(result) {
			    result.on('data', function(chunk) {
			      compareresult += chunk;
	      	    });
					  
			    result.on('end', function () {
	  	 	      var $ = cheerio.load(compareresult); 
	  	  	      var updateHtml=$('table.diff.diff-contentalign-left').html();  
						
		          ref.set({title:key, email:email, revision:rev}, function(error) {
		            if (error) {			
		      	      console.log("%s updateWikiRev to firebase fail", key);
		      	    }
		      	    else {
		      		  //console.log("%s updateWikiRev to firebase success", key);
		      	    }
		          });	   	
      		      //send email
      		  	  var mailArray=email.split(',');
      		  	  mailArray.forEach(function(mailAddress){
      		  	    sendEmail(mailAddress, subkey, updateHtml);
			      });
			    });	 	  
			  });
					  
		      comparerequest.on('error', function(e) {
			    console.error('compare error');
			    console.error(e);
		      });

		      comparerequest.end();	   		  
		    }  	
		  }//query rev else
 	 	});//query rev   	 
	  }//pageNum else
  	});//res
  });//request
  
  request.on('error', function(e) {
    console.error('error');
    console.error(e);
  });

  request.end();		
}

function watchSubscribe(){
  //query every child from firebase
  var SbuscribeQuery= 'https://twangrytest.firebaseio.com/subscribe/';
  var ref=new Firebase(SbuscribeQuery);
  ref.on('child_added', function(snapshot) {
	var title=decodeURIComponent(snapshot.child('title').val());
	updateSubscribe(title);
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
    this.params.template = template;
    this.params.filename = 'templates/'+template+'.ejs';
    var page = fs.readFileSync(this.params.filename, 'utf-8');
    var html = ejs.render(page, this.params);
  }
  if(!head){
    head = {"Content-Type": "text/html"};
  }
  res.writeHead(200, head);
  res.end(html);
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
    request(config.index._source, function (error, response, data) {
      if (!error && data) {
        // cached
        index.get_json(data);
      }
    });
  }, 600*1000);
*/
  
  //add watchSubscribe by interval = 24 hour
  setInterval(watchSubscribe, 86400*1000);
}

module.exports = route;
