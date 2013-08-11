var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

function grab(uri){
  request(uri, function(error, response, data){
    console.log('fetching... '+uri);
    if(error){
    }
    else{
      var $ = cheerio.load(data);
      if(uri.match(/google/i)){
        var u = $("#search cite").eq(0).text();
        u = 'http://zh.wikipedia.org/w/index.php?&action=render&variant=zh-tw&title='+u.replace('zh.wikipedia.org/wiki/','');
        setTimeout(function(){
          grab(u);
        }, 2000);
      }
      else
      if(uri.match('wikipedia')){
        var content = $('p').eq(0);
        var keys = uri.split('title=');
        content = "\n"+keys[1]+','+content.text().replace(/<[^>]+>/, '');
        fs.appendFile('./grab.csv', content, function (err) {
          
        });
      }
      else{
        $('a').each(function(){
          var href = $(this).attr('href');
          setTimeout(function(){
            grab(href);
          }, 5000);
        });
      }
    }
  });
}

grab('http://ttcat.net/gettags/?q=2012');
grab('http://ttcat.net/gettags/?q=2011');
grab('http://ttcat.net/gettags/?q=2010');
grab('http://ttcat.net/gettags/?q=2009');
grab('http://ttcat.net/gettags/?q=2008');
grab('http://ttcat.net/gettags/?q=2007');
