var request = require('request');
var cheerio = require('cheerio');
var nconf = require('nconf');
var fs = require('fs');
var url = require('url');
var async = require('async');

// local library
var Timeline = require(nconf.get('base')+'/lib/timeline');
var utils = require(nconf.get('base')+'/lib/utils');
var Dateparser = require(nconf.get('base')+'/lib/'+nconf.get('parser'));

// obj
var wikipedia = {};

/**
 * Page route of this module
 *
 * @param object tpl
 *   template object made by template.js
 * @param array args
 *   string to fetch article
 * @param string ext
 *   file extension from url
 * @param function callback
 *   callback when finish request.
 *
 * @return string
 *   error message
 */
wikipedia.route = function(tpl, args, ext, callback){
  if(args[1]){
    var keys = [args[1]];
    if(args[2])
      keys.push(args[2]);
    if(wikipedia.hasOwnProperty(ext)){
      wikipedia[ext](tpl, keys, callback);
    }
  }
}

/**
 * Html route
 *
 * Path will be /wikipedia/key, /wikipedia/key.html
 */
wikipedia.html = function(tpl, in_keys, callback){
  var keys = [];
  in_keys.forEach(function(key) {
    // find wikipedia key
    var tmp = utils.keysFind(key);
    tmp.forEach(function(elem){keys.push(elem);});

    // already wikipedia key
    if (tmp.length === 0)
      keys.push(key);
  });

  // generate json first
  var title = in_keys.join('/');
  wikipedia.update(keys, 0, function(){
    tpl.set('page_title', title + ' - ' + nconf.get('page:sitename'));
    tpl.set('wiki_sources', keys);

    var tl = {
      'source': tpl.get('base_url')+'/wikipedia/'+title+'.json',
      'start_zoom_adjust': 5,
      'start_at_end': false,
    };
    tpl.set('timeline', tl);
    tpl.set('ogimage', 'test');
    tpl.set('ogdescription', 'test');
    tpl.set('mtime', 'test');
    callback();
  });
}

/**
 * JSON route
 *
 * The path will /wikipedia/key.json,
 *
 * Will not here when json file exists.
 * Will not here when key contain multiple sub keys.
 */
wikipedia.json = function (tpl, in_keys, callback){
  var keys = [];
  in_keys.forEach(function(key){
    // find wikipedia key
    var tmp = utils.keysFind(key);
    tmp.forEach(function(elem){keys.push(elem);});

    // already wikipedia key
    if (tmp.length === 0)
        keys.push(key);

  });

  var path = 'pub/cache/wikipedia/';
  if(keys.length == 1){
    if (fs.existsSync(path + keys[0] + '.json')) {
      var data = fs.readFileSync(path + keys[0] + '.json', 'utf-8');
      if(data){
        tpl.set('json', data);
      }
    }
  }
  else{
    var data = JSON.stringify(wikipedia.jsonMerge(keys));
    tpl.set('json', data);
  }
  callback();
}

/**
 * Merge JSON by given keys
 *
 * Only merge cached json, should be call wikipedia.update first
 *
 * @param array keys
 *   keys found by utils.keysFind or added manually
 */
wikipedia.jsonMerge = function(keys){
  var results = [];
  var path = 'pub/cache/wikipedia/';
  keys.forEach(function(key){
    if(fs.existsSync(path + key + '.json')){
      var data = fs.readFileSync(path + key + '.json', 'utf-8');
      if(data){
        var json = JSON.parse(data);
        results.push(json);
      }
    }
  });
  var first;
  if(results.length){
    first = results.shift();
    results.forEach(function(t){
        first.timeline.date = first.timeline.date.concat(t.timeline.date);
    });
  }
  else{
    first = {};
  }
  return first;
}

/**
 * Update json by given keys
 *
 * This can be trigger by background or front end url.
 * Will iterate given array, to update each wikipedia page.
 *
 * @param array keys
 *   keys found by utils.keysFind or added manually
 * @param int force
 *   microsecond interval to check update, default is 86400000
 */
wikipedia.update = function(keys, force, cb) {
  var dir = 'pub/cache/wikipedia/';
  var call_stack = [];
  var now = Date.now();

  force = force ? force : 86400000;
  keys.forEach(function(key){
    if(key.length < 64){ // for security reason
      var path = dir + key + '.json';
      // check file modify time
      if(fs.existsSync(path)){
        var mtime = fs.statSync(path).mtime.getTime();
        if(now - mtime > force){
          call_stack.push(function (callback){ wikipedia.updateSingle(key, callback); });
        }
      }
      else{
        call_stack.push(function (callback){ wikipedia.updateSingle(key, callback); });
      }
    }
  });
  async.parallel(call_stack, function(err, results) {
    if(err){
      console.log('Parallel error');
    }
    else{
      var error = saved = null;
      results.forEach(function (t) {
        if(t.json){
          if (t.json.timeline.headline !== null) {
            fs.writeFile(dir+t.json.timeline.headline+'.json', t.exportjson());
            saved += t.json.timeline.headline;
          }
        }
        else{
          error = 1;
        }
      });
      if(error){
        console.log('Parse timeline failed, keys:' + keys.join(',') + 'successed:' + saved);
      }
      else{
        cb();
      }
    }
  });
}

/**
 * Asynchronize update json by single given key
 *
 * This function using request, so we should pass
 * callback function inorder to get results.
 *
 * @param string key
 *   wikipedia article key
 * @param object timeline
 *   timeline object declaire by Timeline
 * @param function callback
 *   callback function for parallel async
 */
wikipedia.updateSingle = function(key, callback){

  // no matter what, debug mode will return html from local storage
  if(nconf.get('debug')){
    console.log("debug mode - only load data on pub/cache/debug.html");
    var timeline = new Timeline();
    var data = fs.readFileSync('pub/cache/debug.html', 'utf-8');
    wikipedia.parseHTML(data, key, timeline, callback);
    timeline = null; // release memory
  }
  else{
    var uri = nconf.get('wikipedia:scheme') + nconf.get('wikipedia:domain') + '/' + nconf.get('wikipedia:render') + key;
    request(uri, function (error, response, data) {
      if(error){
        console.log('ERR:' + error.code + '-- wikipedia key:' + key);
      }
      else if (response.statusCode == 200 && data) {
        var timeline = new Timeline();
        wikipedia.parseHTML(data, key, timeline, callback);
        timeline = null; // release memory
      }

    });
  }
}

/**
 * Watch keys to be update
 *
 * This function will run by setInterval to Watch
 * if exists key need to be update
 */
wikipedia.updateWatch = function(){
  var to_be_update = [];
  var dir = 'pub/cache/wikipedia/'; // your directory
  var now = Date.now();
  if(fs.existsSync(index)){
    json = JSON.parse(fs.readFileSync(index));
    for(k in utils.keys){
      var keys = utils.keysFind(k);
      keys.forEach(function(key){
        var path = dir + key + '.json';
        if(fs.existsSync(path)){
          var mtime = fs.statSync(path).mtime.getTime();
          var interval = now - mtime;
          if(interval > 86400000){
            to_be_update.push(key);
          }
        }
      });
    }
  }

  if(to_be_update.length){
    wikipedia.update(to_be_update, 86400000);
  }
}

/**
 * Parse given HTML
 *
 * @param string html
 *   String of html
 * @param string key
 *   String of key in this html, will be use when save cache
 * @param object timeline
 *   timeline object declaire by Timeline
 * @param function callback
 *   callback function when complete parse.
 *
 * @return object
 *   Will return Timeline object if no callback
 */
wikipedia.parseHTML = function(html, key, timeline, callback){
  var parse_date_page = function($){
    var year = key.match(/[1-2][0-9]{3}年/);
    $('h2').each(function(){
      var date = year + $(this).text();
      startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
      var content = $.html($(this).next());
      timeline.setDate(startDate, date, content, {}, {}, key);
    });
  }

  var image_origin = function(src){
    if(src.match(/\.svg/)) return src;
    var l = src.lastIndexOf('/');
    return src.substr(0, l).replace('/thumb', '');
  }

  var parse_chinese_date = function($, asset){
    $('.wikitable').remove();
    var html = $.html();
    var text = '';
    var dateparser = new Dateparser();
    dateparser.parse(html);
    var matches = dateparser.dump();
    dateparser = null;
    if(matches){
      matches.forEach(function(date) {
        var summary = timeline.textRender(date.summary);
        var tag;
        if(summary.match(/<sup>.+(出版|參考文獻|參考資料|參見|外部連結|內文註釋|資料來源|註釋|相關參見|參考來源|相關條目).+<\/sup>/)){
          return false;
        }
        summary = summary.replace(/<a[^>]*>((?:\d+年)?(?:\d+月)?(?:\d+日)?)<\/a>/g, '$1');
        summary = summary.replace(/rel="([^"]+)"/g, 'href="'+nconf.get('wikipedia:scheme')+nconf.get('wikipedia:domain')+'/wiki/'+key+'#$1"');

        var d = cheerio.load(summary);
        tag = key;//d('sup > a.sup').eq(0).text().replace(/\[|\]/g,'');
        // section link
        // get asset
        if(!asset){
          if(d('.reference')){
            var ref = d('.reference a').attr('href');
            var ahref = $(ref).find('a.external');
            if(ahref){
              asset = timeline.asset(ahref.attr('href'), '', ahref.text());
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

        if(date.title.match(/\./)){
          var title = date.title.split('.');
          title = title[0].replace(/\,/g, '/')+'<sub><a href="'+nconf.get('wikipedia:scheme')+nconf.get('wikipedia:domain')+'/wiki/'+key+'#'+title[1].replace(/\[|\]/g, '')+'" class="icon-time" style="font-family: FontAwesome;" title="由引用文獻自動判斷的時間"></a></sub>';
        }
        else{
          title = date.title.replace(/\,/g, '/').replace(/\/$/, '');
        }

        var over = text.replace(/(<[^>]+>|<\/[^>]+>)/gi, '');
        if(over.length > nconf.get('wikipedia:min_length') && !over.match('ISBN')){
          text = text.replace(/(<(ol|li|ul)[^>]*>|<\/(ol|li|ul)>)/gi, '');
          timeline.setDate(date.startDate, date.endDate, title, text, asset, tag);
        }

        // clear for next loop
        asset = text = null;
      });
    }
  }
  var parse_thumb = function($){
    $('.thumbinner').each(function(){
      // clear
      $(this).find('.magnify').remove();

      // image
      var src = $(this).find('img').attr('src');
      src = image_origin(src);
      src = 'http:'+src;
      var asset = timeline.asset(src, '', '');

      // text
      var caption = $(this).children('.thumbcaption');
      var d = cheerio.load(caption.text());
      parse_chinese_date(d, asset);
      $(this).remove();
    });
  }
  var convertMonth = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
    '一月': '01',
    '二月': '02',
    '三月': '03',
    '四月': '04',
    '五月': '05',
    '六月': '06',
    '七月': '07',
    '八月': '08',
    '九月': '09',
    '十月': '10',
    '十一月': '11',
    '十二月': '12',
  }
  var parse_table = function($){
    $('.wikitable').each(function(){
      $(this).find('tr').each(function(){
        var year, month, day, content = '';
        var asset = {};
        $(this).find('td').each(function(){
          var r;
          if($(this).text().length > 14){
            $(this).find('sup a').each(function(idx){
              if(idx === 0){
                var ref = $(this).attr('href').replace(':', '\\:');
                if(ref.match(/^#/)){
                  var ahref = $(ref).find("a.external");
                  if(ahref){
                    asset = timeline.asset(ahref.attr('href'), '', ahref.text());
                  }
                }
              }
            });
            content += $(this).text();
            content = content.replace(/\[\d+\]/, '');
          }
          else if(r = $(this).text().match(/[1-2][0-9]{3}(年)?/)){
            year = r[0].replace(/年/g, '');
          }
          else if(r = $(this).text().match(Object.keys(convertMonth).join('|'))){
            month = convertMonth[r[0]];
          }
        })
        if (year && content) {
          var date = year;
          if(month){
            date += '/' + month;
          }
          if(day){
            date += '/' + day;
          }
          timeline.setDate(date, '', date, content, asset, key);
        }
      })
    })
  }
  var $ = cheerio.load(html);
  // prepare clean body
  $('#spoiler').remove();
  $('.mw-editsection').remove();
  $('.ambox').remove();
  $('.navbox').remove();
  $('.noprint').remove();
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
            src = image_origin(src);
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
    parse_date_page($);
  }
  else{
    parse_thumb($);
    parse_chinese_date($);
    parse_table($);
  }

  if(typeof callback == 'function'){
    callback(null, timeline);
  }
  else{
    return timeline;
  }
}

module.exports = wikipedia;
