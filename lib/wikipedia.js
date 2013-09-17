var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var url = require('url');
var timeline = require('./timeline');
var dateparser = require('./zhdateparser');

function Wiki(key) {
  this.key = key;
  this._scheme = 'http://';
  this._domain = 'zh.wikipedia.org';
  this.base_url = this._scheme + this._domain +'/';
  this._api = 'w/api.php?action={action}&prop={prop}&format=json&titles=';
  this._render = 'w/index.php?&action=render&variant=zh-tw&title=';
  this._minLength = 50;
  this.timeline = timeline();
}

Wiki.prototype.request = function(callback){
  var uri = this.base_url + this._render + this.key;
  var wp = this;
  request(uri, function (error, response, data) {
    if(error) { 
      callback(true);
    }
    else{
      wp.parseDom(cheerio.load(data), callback);
    }
  });
}

Wiki.prototype.appendTimeline = function (src, req) {
  var w = this;
  if (fs.existsSync('public/cache/wiki/' + this.key + '.json') && !req.url.match('nocache=1')) {
    src.push(function (callback) {
      var tl = timeline();
      tl.json = JSON.parse(fs.readFileSync('public/cache/wiki/' + w.key + '.json'));
      callback(null, tl);
    });
  }
  else {
    src.push(function (callback) {
      w.request(callback);
    });
    src.push(function (callback) {
      setTimeout(function () {
        w.requestCoord(callback);
      }, 500);
    });
  }
}

Wiki.prototype.requestCoord = function(callback){
  var api = this._api.replace('{action}', 'query').replace('{prop}', 'coordinates');
  var wp = this;
  request(this.base_url + api + this.key, function(e, r, d){
    if(!e && d){
      var regex = /"lat":([^,]+),"lon":([^,]+)/;
      if(regex.test(d)){
        var coord = d.match(regex);
        coord.shift();
        var src = 'https://maps.google.com.tw/maps?t=h&z=8&iwloc=A&q='+coord.join(',');
        var asset = wp.timeline.asset(src, '', wp.key);
        wp.timeline.set('asset', asset);
      }
      callback(null, wp.timeline);
    }
    else{
      callback(e);
    }
  });
}

Wiki.prototype.parseDom = function($, callback){
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
        if(src.match(/(jpg|jpeg|png|gif)$/) && !src.match(/\.svg/)){
          src = this.imageOrigin(src);
        }
        else{
          src = '';
        }
      }
    }
    if(src){
      var asset = this.timeline.asset(src, '', desc);
      this.timeline.set('asset', asset);
    }
  }

  $('p').eq(0).remove();
  this.timeline.set('headline', this.key);
  this.timeline.set('text', summary);

  // parse date in the body
  // $('.references').remove(); // berfore parse, remove reference first.
  if(this.key.match(/[1-2][0-9]{3}年[0-9]{1,2}月/)){
    this.parseDatePage($); 
  }
  else{
    this.parseThumb($);
    this.parseChineseDate($);
  }
  callback(null, this.timeline);
}

Wiki.prototype.parseThumb = function($){
  var wp = this;
  $('.thumbinner').each(function(){
    // clear
    $(this).find('.magnify').remove();

    // image
    var src = $(this).find('img').attr('src');
    src = wp.imageOrigin(src);
    src = 'http:'+src;
    var asset = wp.timeline.asset(src, '', '');

    // text
    var caption = $(this).children('.thumbcaption');
    wp.parseChineseDate(caption, caption.text(), asset);
    $(this).remove();
  });
}

Wiki.prototype.parseChineseDate = function($, text, asset){
  var html = text ? '<div>'+text+'</div>' : $.html();

  dateparser.parse(html);
  var matches = dateparser.dump();
  var wp = this;
  if(matches){
    matches.forEach(function(date) {
      var tag;
      if(date.summary.match(/<sup>.+(出版|參考文獻|參考資料|參見|外部連結|內文註釋|資料來源|註釋|相關參見|參考來源|相關條目).+<\/sup>/)){
        return false;
      }
      date.summary = date.summary.replace(/<a[^>]*>((?:\d+年)?(?:\d+月)?(?:\d+日)?)<\/a>/g, '$1');
      date.summary = date.summary.replace(/rel="([^"]+)"/g, 'href="'+wp.base_url+'wiki/'+wp.key+'#$1"');

      var d = cheerio.load(date.summary);
      tag = d('sup > a.sup').eq(0).text().replace(/\[|\]/g,'');
      // section link
      // get asset
      if(!asset){
        if(d('.reference')){
          var ref = d('.reference a').attr('href');
          if(typeof(ref) === 'string' && ref.match(/#cite_note-\d+/)){
            var ahref = $(ref).find('a.external');
            if(ahref){
              asset = wp.timeline.asset(ahref.attr('href'), '', ahref.text());
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
              if(wikihref.match(this._domain+'/wiki/')){
                asset = wp.timeline.asset(wikihref, '', d(this).attr('title'));
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

      var over = text.replace(/(<[^>]+>|<\/[^>]+>)/gi, '');
      if(over.length > wp._minLength && !over.match('ISBN')){
        text = text.replace(/(<(ol|li|ul)[^>]*>|<\/(ol|li|ul)>)/gi, '');
        wp.timeline.setDate(date.startDate, date.endDate, date.title, text, asset, tag);
      }

      // clear for next loop
      asset = text = null;
    });
  }
}

Wiki.prototype.parseDatePage = function($){
  var year = this.key.match(/[1-2][0-9]{3}年/);
  var wp = this;
  $('h2').each(function(){
    var date = year + $(this).text();
    startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
    var content = $.html($(this).next());
    wp.timeline.setDate(startDate, date, content);
  });
}

Wiki.prototype.imageOrigin = function(src){
  var l = src.lastIndexOf('/');
  return src.substr(0, l).replace('/thumb', '');
}

Wiki.prototype.updateCache = function(){
  var limit = 1;
  var base_url = 'http://fact.g0v.tw/';
  var dir = 'public/cache/wiki/'; // your directory
  var index = 'public/cache/index.json';
  var now = Date.now();
  if(fs.existsSync(index)){
    json = JSON.parse(fs.readFileSync(index));
    Object.keys(json.wikiArticles).forEach(function(k){
      var v = json.wikiArticles[k].split(',');
      v.forEach(function(key){
        var path = dir + key + '.json';
        fs.exists(path, function(exists){
          if(exists){
            var mtime = fs.statSync(path).mtime.getTime();
            var interval = now - mtime;
            if(interval > 86400000){
              var url = base_url+'wiki/'+key+'.json?nocache=1';
              request(url, function (error, response, body) {
                console.log(url);
              });
            }
          }
        });
      });
    });
  }
}

function wiki(key) {
  return new Wiki(key);
}

module.exports = wiki;
