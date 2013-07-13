var timeline = require('./timeline');
var cheerio = require('cheerio');

var wiki = {};
wiki.option = {
  domain: 'http://zh.wikipedia.org/',
  api: 'w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=',
  render: 'http://zh.wikipedia.org/w/index.php?&action=render&variant=zh-tw&title='
};
wiki.parse = function(dom, body, page){
  timeline.init();
  var img = dom('a.image').find('img').eq(0);
  var desc = dom('.thumbinner').eq(0).text().replace(/(\r\n|\n|\r)/gm, '');
  var summary = dom('p').eq(0).text();
  var src = img.attr('src');
  if(src){
    src = 'http:'+src.replace('http:','');
    var primaryImg = timeline.asset(src, '', desc);
    timeline.set('asset', primaryImg);
  }
  timeline.set('headline', page);
  timeline.set('text', summary);
  wiki.parseChineseDate(body);

  return timeline.exportjson();
}
wiki.parseChineseDate = function(content){
  var matches = content.match(/[1-2][0-9]{3}年[0-9]{1,2}月.+(。|\n)/g);

  if(matches.length){
    matches.forEach(function(summary) {
      summary = summary.replace('\n','');
      var m = summary.match(/([1-2][0-9]{3}年[0-9]{1,2}月[0-9]{1,2}日)|([1-2][0-9]{3}年[0-9]{1,2}月)/);
      var date = m[0];
      var startDate = date.replace(/(月)|(日)|(年)/g, ',').replace(/,$/, '');
      var d = cheerio.load('<div>'+summary+'</div>');
      var text = d('*').text();
      var text = text.replace(/\[[0-9]+\]/g, '');
      var text = text.replace(/\[來源請求\]/g, '');
      if(text.length !== date.length){
        timeline.setDate(startDate, date, text);
      }
    });
  }
}



module.exports = wiki;
