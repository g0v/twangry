var request = require('request');
var cheerio = require('cheerio');
var config = require('config');
var fs = require('fs');
var url = require('url');
var timeline = require('./timeline');
var dateparser = require('./zhdateparser');

function Wiki(key) {
  for (var attr in config.wikipedia) {
    this[attr] = config.wikipedia[attr];
  }
  this.key = key;
  this.base_url = this._scheme + this._domain +'/';
  this.timeline = timeline();
}

Wiki.prototype.request = function(callback){
  if(config.debug){
    console.log("debug mode - only load data on public/cache/debug.html");
    var data = fs.readFileSync('public/cache/debug.html', 'utf-8');
    this.parseDom(cheerio.load(data), callback);
  }
  else{
    var uri = this.base_url + this._render + this.key;
    var wp = this;
    request(uri, function (error, response, data) {
      if(error || response.statusCode == 404) {
        callback(true);
      }
      else{
        wp.parseDom(cheerio.load(data), callback);
      }
    });
  }
}

Wiki.prototype.appendTimeline = function (src, req) {
  var w = this;
  if (fs.existsSync('public/cache/wiki/' + this.key + '.json') && !req.url.match('nocache=1')) {
    src.push(function (callback) {
      var tl = timeline();
      var stats = fs.statSync('public/cache/wiki/' + w.key + '.json');
      if(stats.size){
        tl.json = JSON.parse(fs.readFileSync('public/cache/wiki/' + w.key + '.json'));
      }
      else{
        tl.json = null;
      }
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
  var imgs, img, src, desc, width;
  imgs = $('a.image > img');
  width = 0;
  if(imgs.length){
    for(i in imgs){
      img = imgs[i];
      if(img.name == 'img'){
        width = $(img).attr('width') || 1;
        if(parseInt(width) > 100){
          desc = $(img).parents('.thumbinner');
          if(desc.length){
            desc = desc.eq(0).text().replace(/(\r\n|\n|\r)/gm, '');
          }
          else{
            desc = '';
          }
          src = $(img).attr('src');
          if(src.match(/(jpg|jpeg|png|gif)$/i)){
            src = this.imageOrigin(src);
          }
          else{
            src = '';
          }
          break;
        }
      }
    }
  }
  $('.infobox').remove();
  $('.rellink').remove();
  
  // prepare headline
  var summary;
  summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  if($('#coordinates').length){
    $('#coordinates').remove();
    summary = $('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  }
  else{
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
      var summary = wp.timeline.textRender(date.summary);
      var tag;
      if(summary.match(/<sup>.+(出版|參考文獻|參考資料|參見|外部連結|內文註釋|資料來源|註釋|相關參見|參考來源|相關條目).+<\/sup>/)){
        return false;
      }
      summary = summary.replace(/<a[^>]*>((?:\d+年)?(?:\d+月)?(?:\d+日)?)<\/a>/g, '$1');
      summary = summary.replace(/rel="([^"]+)"/g, 'href="'+wp.base_url+'wiki/'+wp.key+'#$1"');

      var d = cheerio.load(summary);
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

      if(date.title.match(/\./)){
        var title = date.title.split('.');
        title = title[0].replace(/\,/g, '/')+'<sub><a href="'+wp.base_url+'wiki/'+wp.key+'#'+title[1].replace(/\[|\]/g, '')+'" class="icon-time" style="font-family: FontAwesome;"></a></sub>'
      }
      else{
        title = date.title.replace(/\,/g, '/').replace(/\/$/, '');
      }

      var over = text.replace(/(<[^>]+>|<\/[^>]+>)/gi, '');
      if(over.length > wp._minLength && !over.match('ISBN')){
        text = text.replace(/(<(ol|li|ul)[^>]*>|<\/(ol|li|ul)>)/gi, '');
        wp.timeline.setDate(date.startDate, date.endDate, title, text, asset, tag);
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
  if(src.match(/\.svg/)) return src;
  var l = src.lastIndexOf('/');
  return src.substr(0, l).replace('/thumb', '');
}

Wiki.prototype.updateCache = function(){
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
                console.log('Update cache: '+url);
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
