var timeline = require('./timeline');
var cheerio = require('cheerio');

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

var wiki = {};
wiki.option = {
  domain: 'zh.wikipedia.org',
  api: 'w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=',
  render: 'w/index.php?&action=render&variant=zh-tw&title=',
  minLength: 30,
};
wiki.parse = function(dom, body, page){
  timeline.init();

  // prepare clean body
  dom('#coordinates').remove();
  dom('.infobox').remove();
  dom('.mw-editsection').remove();
  dom('.ambox').remove();
  dom('.navbox').remove();
  
  // prepare headline
  var src = desc = null;
  dom('a.external').each(function(){
    // trying to find video 
    var href = dom(this).attr('href');
    if(href.match('youtube.com')){
      src = href;
      desc = dom(this).text();
      return;
    }
  });
  var summary = dom('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  dom('p').eq(0).remove();

  if(!src){
    var img = dom('a.image').find('img').eq(0);
    var desc = dom('.thumbinner').eq(0).text().replace(/(\r\n|\n|\r)/gm, '');
    src = img.attr('src');
    if(src){
      src = 'http:'+src.replace(/\/[0-9]{3}px/, '/640px');
    }
  }
  if(src){
    var asset = timeline.asset(src, '', desc);
    timeline.set('asset', asset);
  }
  timeline.set('headline', page);
  timeline.set('text', summary);

  // parse date in the body
  dom('.references').remove(); // berfore parse, remove reference first.
  if(page.match(/[1-2][0-9]{3}年[0-9]{1,2}月/)){
    wiki.parseDatePage(dom, page); 
  }
  else{
    wiki.parseThumb(dom);
    wiki.parseChineseDate(dom, null, null);
  }

  return timeline.exportjson();
}
wiki.parseThumb = function(dom){
  dom('.thumbinner').each(function(){
    // clear
    dom(this).find('.magnify').remove();

    // image
    var src = dom(this).find('img').attr('src');
    src = src.replace(/\/[0-9]{3}px/, '/640px');
    src = 'http:'+src;
    var asset = timeline.asset(src, '', '');

    // text
    var caption = dom(this).children('.thumbcaption');
    wiki.parseChineseDate(caption, caption.text(), asset);
    dom(this).remove();
  });
}
wiki.parseChineseDate = function(dom, text, asset){
  var html = text ? '<div>'+text+'</div>' : dom.html();

  // first, find date without year
  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");
  var pattern = /[^年][0-9]{1,2}月[0-9]{1,2}日/g;
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
        var wikihref = d('a').eq(0).attr('href') || '';
        var wikitext = d('a').eq(0).text();
        if(wikihref.match(wiki.option.domain+'/wiki/') && !wikitext.match(/[1-2][0-9]{3}年/)){
          d('a').eq(0).attr('href', 'http://'+wiki.option.domain+'/wiki/'+encodeURI(wikitext));
          asset = timeline.asset('http://'+wiki.option.domain+'/wiki/'+wikitext, '', '');
        }
      }

      // get text
      if(!text){
        var text = d.html();
        text = text.replace(/\[[0-9]+\]/g, '');
        text = text.replace(/\[來源請求\]/g, '');
      }

      // get startDate
      var startDate = null;
      summary = summary.replace('\n','').replace(/(<[a-z]+\s[^>]+|<\/[a-z]+>)/i, '').replace('年代','年');
      var m = summary.match(/[1-2][0-9]{3}年([0-9]{1,2}月|)([0-9]{1,2}日|)/);
      var date = m[0];
      if(date.match('年底')){
        startDate = date.replace('年底', '12月31日');
      }
      else{
        startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
      }

      if(text.length > wiki.option.minLength){
        timeline.setDate(startDate, date, text, asset);
      }

      // clear for next loop
      asset = text = null;
    });
  }
}
wiki.parseDatePage = function(dom, page){
  var year = page.match(/[1-2][0-9]{3}年/);
  dom('h2').each(function(){
    var date = year + dom(this).text();
    startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
    var content = dom.html(dom(this).next());
    timeline.setDate(startDate, date, content);
  });
}

module.exports = wiki;
