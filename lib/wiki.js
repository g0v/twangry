var request = require('request');
var cheerio = require('cheerio');
var timeline = require('./timeline');
var dateparser = require('./zhdateparser');

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
  $('#spoiler').remove();
  $('.mw-editsection').remove();
  $('.ambox').remove();
  $('.navbox').remove();
  var img = $('a.image').find('img').eq(0);
  $('.infobox').remove();
  $('.rellink').remove();
  
  // prepare headline
  var summary, src, desc;
  summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  if($('#coordinates').length){
    $('#coordinates').remove();
    summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  }
  else{
  /*
    $('a.external').each(function(){
      // trying to find video 
      var href = $(this).attr('href');
      if(href.match('youtube.com')){
        src = href;
        desc = $(this).text();
        return;
      }
    });
  */
    if(!src){
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
  // $('.references').remove(); // berfore parse, remove reference first.
  if(key.match(/[1-2][0-9]{3}年[0-9]{1,2}月/)){
    wiki.parseDatePage($, key); 
  }
  else{
    wiki.parseThumb($, key);
    wiki.parseChineseDate($, key);
  }
}

wiki.parseThumb = function($, key){
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
    wiki.parseChineseDate(caption, key, caption.text(), asset);
    $(this).remove();
  });
}

wiki.parseChineseDate = function($, key, text, asset){
  var html = text ? '<div>'+text+'</div>' : $.html();

  dateparser.parse(html);
  var matches = dateparser.dump();
  if(matches){
    matches.forEach(function(date) {
      var tag;
      if(date.summary.match(/<sup>.+(參考資料|參見|外部連結).+<\/sup>/)){
        return false;
      }
      date.summary = date.summary.replace(/<a[^>]*>((?:\d+年)?(?:\d+月)?(?:\d+日)?)<\/a>/g, '$1');
      date.summary = date.summary.replace(/rel="([^"]+)"/g, 'href="'+wiki.base_url+'wiki/'+key+'#$1"');

      var d = cheerio.load(date.summary);
      // section link
      // get asset
      if(!asset){
        if(d('.reference')){
          var ref = d('.reference a').attr('href');
          if(typeof(ref) === 'string' && ref.match(/#cite_note-\d+/)){
            var ahref = $(ref).find('a.external');
            if(ahref){
              asset = timeline.asset(ahref.attr('href'), '', ahref.text());
            }
          }
          d('.reference').remove();
        }

        if(!asset){
          d('a.new').each(function(){
            d(this).after('<span>'+d(this).text()+'</span>');
            d(this).remove();
          });
          d('a').each(function(){
            if(!asset && !d(this).hasClass('sup')){
              var wikihref = d(this).attr('href') || '';
              var wikitext = d(this).text();
              if(wikihref.match(wiki._domain+'/wiki/')){
                asset = timeline.asset(wikihref, '', d(this).attr('title'));
                return;
              }
            }
          });
        }
      }

      // get text
      if(!text){
        var text = d.html();
        text = text.replace(/\[[0-9]+\]/g, '');
        text = text.replace(/\[來源請求\]/g, '');
      }

      var over= text.replace(/(<[a-z]+\s[^>]+>|<\/[a-z]+>)/gi, '');
      if(over.length > wiki._minLength && !over.match('ISBN')){
        timeline.setDate(date.startDate, date.endDate, date.title, text, asset, tag);
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
