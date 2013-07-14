var timeline = require('./timeline');
var cheerio = require('cheerio');

var wiki = {};
wiki.option = {
  domain: 'zh.wikipedia.org',
  api: 'w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=',
  render: 'w/index.php?&action=render&variant=zh-tw&title='
};
wiki.parse = function(dom, body, page){
  timeline.init();

  // prepare clean body
  dom('.references').remove();
  dom('.ambox').remove();
  
  // prepare headline
  var img = dom('a.image').find('img').eq(0);
  var desc = dom('.thumbinner').eq(0).text().replace(/(\r\n|\n|\r)/gm, '');
  var summary = dom('p').eq(0).text().replace(/\[[0-9]+\]/g, '');
  var src = img.attr('src');
  if(src){
    src = 'http:'+src.replace('http:','');
    var primaryImg = timeline.asset(src, '', desc);
    timeline.set('asset', primaryImg);
  }
  timeline.set('headline', page);
  timeline.set('text', summary);

  // parse date in the body
  wiki.parseThumb(dom);
  wiki.parseChineseDate(dom, null, null);

  return timeline.exportjson();
}
wiki.parseThumb = function(dom){
  dom('.thumbinner').each(function(){
    // clear
    dom(this).find('.magnify').remove();

    // image
    var src = dom(this).find('img').attr('src');
    src = 'http:'+src.replace('http:','');
    var asset = timeline.asset(src, '', '');

    // text
    var caption = dom(this).children('.thumbcaption');
    wiki.parseChineseDate(caption, caption.text(), asset);
    dom(this).remove();
  });
}
wiki.parseChineseDate = function(dom, text, asset){
  var content = text ? '<div>'+text+'</div>' : dom.html();
  var matches = content.match(/(<a[^>]+>|)[1-2][0-9]{3}年(<\/a>|代|底|)([0-9]{1,2}月|)([0-9]{1,2}日|).+(<\/(div|p|li|ul)>|<br\s?\/>|。)/gm);
  if(matches){
    matches.forEach(function(summary) {
      var d = cheerio.load('<div>'+summary+'</div>');

      // get asset
      if(!asset){
        d('.reference').remove();
        d('a.new').remove();
        var wikihref = d('a').eq(0).attr('href') || '';
        var wikitext = d('a').eq(0).text();
        if(wikihref.match(wiki.option.domain+'/wiki/')){
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

      if(text.length !== date.length){
        timeline.setDate(startDate, date, text, asset);
      }

      // clear for next loop
      asset = text = null;
    });
  }
}



module.exports = wiki;
