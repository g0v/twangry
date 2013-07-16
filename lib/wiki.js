var request = require('request');
var cheerio = require('cheerio');
var timeline = require('./timeline');
require('./util');

var wiki = {};
wiki._scheme = 'http://';
wiki._domain = 'zh.wikipedia.org';
wiki.base_url = wiki._scheme + wiki._domain +'/';
wiki._api = 'w/api.php?action={action}&prop={prop}&format=json&titles=';
wiki._render = 'w/index.php?&action=render&variant=zh-tw&title=';
wiki._minLength = 25;

wiki.request = function(key, callback){
  var uri = wiki.base_url+wiki._render+key;
  request(uri, function (error, response, data) {
    if(error) { 
      console.log(error);
      callback(true);
    }
    else{
      var dom =  cheerio.load(data);
      wiki.parse(dom, key);
      callback(null);
    }
  });
}

wiki.requestCoord = function(key, callback){
  var api = wiki._api.replace('{action}', 'query').replace('{prop}', 'coordinates');
  request(wiki.base_url + api+key, function(e, r, d){
    if(!e && d){
      var regex = /"lat":([^,]+),"lon":([^,]+)/;
      if(regex.test(d)){
        var coord = d.match(regex);
        coord.shift();
        var src = 'https://maps.google.com.tw/maps?t=h&z=8&iwloc=A&q='+coord.join(',');
        var asset = timeline.asset(src, '', key);
        timeline.set('asset', asset);
      }
      callback(null);
    }
    else{
      callback(e);
    }
  });
}

wiki.parse = function($, key){
  // prepare clean body
  $('.infobox').remove();
  $('.mw-editsection').remove();
  $('.ambox').remove();
  $('.navbox').remove();
  
  // prepare headline
  var summary = src = desc = null;
  summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  if($('#coordinates')){
    $('#coordinates').remove();
    summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  }
  else{
    $('a.external').each(function(){
      // trying to find video 
      var href = $(this).attr('href');
      if(href.match('youtube.com')){
        src = href;
        desc = $(this).text();
        return;
      }
    });
    if(!src){
      var img = $('a.image').find('img').eq(0);
      var desc = $('.thumbinner').eq(0).text().replace(/(\r\n|\n|\r)/gm, '');
      src = img.attr('src');
      if(src){
        src = wiki.imageOrigin(src);
      }
    }
    if(src){
      var asset = timeline.asset(src, '', desc);
      timeline.set('asset', asset);
    }
  }

  $('p').eq(0).remove();
  timeline.set('headline', key);
  timeline.set('text', summary);

  // parse date in the body
  $('.references').remove(); // berfore parse, remove reference first.
  if(key.match(/[1-2][0-9]{3}年[0-9]{1,2}月/)){
    wiki.parseDatePage($, key); 
  }
  else{
    wiki.parseThumb($);
    wiki.parseChineseDate($);
  }
}

wiki.parseThumb = function($){
  $('.thumbinner').each(function(){
    // clear
    $(this).find('.magnify').remove();

    // image
    var src = $(this).find('img').attr('src');
    src = wiki.imageOrigin(src);
    src = 'http:'+src;
    var asset = timeline.asset(src, '', '');

    // text
    var caption = $(this).children('.thumbcaption');
    wiki.parseChineseDate(caption, caption.text(), asset);
    $(this).remove();
  });
}

wiki.parseChineseDate = function($, text, asset){
  var html = text ? '<div>'+text+'</div>' : $.html();

  // first, find date without year
  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");
  var pattern = /[^年1-9][0-9]{1,2}月[0-9]{1,2}日/g;
  var idx = 0;
  var lyear = null;
  while(m = pattern.exec(html)) {
    var dateidx = m.index+1;
    var range = html.substr(idx, dateidx-idx);
    var years = range.match(/[1-2][0-9]{3}年/g);
    if(years){
      lyear = years.pop();
    }
    if(lyear){
      html = html.insert(dateidx, lyear);
    }
    idx = dateidx;
  }

  // second, parse all the event base on date string
  matches = null;
  matches = html.match(/(<a[^>]+>|)[1-2][0-9]{3}年(<\/a>|代|底|)([0-9]{1,2}月|)([0-9]{1,2}日|).+(<\/(div|p|li|ul)>|<br\s?\/>|。)/g);
  if(matches){
    matches.forEach(function(summary) {
      var d = cheerio.load('<p>'+summary+'</p>');

      // get asset
      if(!asset){
        d('.reference').remove();
        d('a.new').remove();
        d('a').each(function(){
          if(!asset){
            var wikihref = d(this).attr('href') || '';
            var wikitext = d(this).text();
            if(wikihref.match(wiki._domain+'/wiki/') && !wikitext.match(/[1-2][0-9]{3}年/)){
              asset = timeline.asset(wikihref, '', d(this).attr('title'));
              return;
            }
          }
        });
      }

      // get text
      if(!text){
        var text = d.html();
        text = text.replace(/\[[0-9]+\]/g, '');
        text = text.replace(/\[來源請求\]/g, '');
      }

      // get startDate
      var startDate = null;
      summary = summary.replace('\n','').replace(/(<[a-z]+\s[^>]+>|<\/[a-z]+>)/gi, '').replace('年代','年');
      var m = summary.match(/[1-2][0-9]{3}年([0-9]{1,2}月|)([0-9]{1,2}日|)/);
      var date = m[0];
      if(date.match('年底')){
        startDate = date.replace('年底', '12月');
      }
      else{
        startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
      }

      var over= text.replace(/(<[a-z]+\s[^>]+>|<\/[a-z]+>)/gi, '');
      if(over.length > wiki._minLength && !over.match('ISBN')){
        timeline.setDate(startDate, date, text, asset);
      }

      // clear for next loop
      asset = text = null;
    });
  }
}

wiki.parseDatePage = function($, key){
  var year = key.match(/[1-2][0-9]{3}年/);
  $('h2').each(function(){
    var date = year + $(this).text();
    startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
    var content = $.html($(this).next());
    timeline.setDate(startDate, date, content);
  });
}

wiki.imageOrigin = function(src){
  var l = src.lastIndexOf('/');
  return src.substr(0, l).replace('/thumb', '');
}

module.exports = wiki;
