/*
 1月10日
2013年10月10日
1月3日膝蓋中了一箭，10月10日
9-10月10日
9－10月10日
從1911~1913年
1990年代02月10日
膝蓋中了一箭1月10日
膝蓋中了一箭2013年10月10日
1月3日膝蓋中了一箭，10月10日
膝蓋中了一箭9-10月10日
膝蓋中了一箭10－12月10日
膝蓋中了一箭10~12月10日
膝蓋中了一箭10～12月10日
膝蓋中了一箭1911年
膝蓋中了一箭1990年代
西元前236年
test <div>1990年代02月10日</div>
test <li>1990年底02月10日</li>
test <p><li>1990年代02月10日</li></p>
test 1990年代02月10日膝蓋中了一箭。
*/

var zhdateparser = {
  option:{lookback:100,delimeter:','}
};
zhdateparser.dates = [];
zhdateparser.push = function(date){
  this.dates.push(date);
};
zhdateparser.dump = function(){
  var r = this.dates;
  this.dates = [];
  return r;
};

zhdateparser.parse = function(html){
  // replace all the html wrap on year or date
  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");  // date in tag
  html = html.replace(/(<[^>]+>)?(\d\d{3}年)(<[^>]+>)?(<[^>]+>)?(\d{1,2}月)(<[^>]+>)?(<[^>]+>)?(\d{1,2}日)(<[^>]+>)?/g, "$2$5$8");

  // try to insert year to date only string
  var idx = 0;
  var lyear = '';
  var date = {};

  html = ' '+html; // in order to make below regular expression work
  var pattern = /[^年0-9]([0-9]{1,2})?(－|-|~|～)?[0-9]{1,2}月[0-9]{1,2}日/g;
  while(m = pattern.exec(html)) {
    if (m.index == pattern.lastIndex) pattern.lastIndex++;
    var dateidx = m[0].match(/^\d/) ? m.index : m.index+1;
    var range = html.substr(idx, dateidx-idx);
    var years = range.match(/[1-2][0-9]{3}年/g);
    if(years){
      lyear = years.pop();
      if(lyear){
        html = this.insertYear(html, dateidx, lyear);
      }
    }
    idx = dateidx;
  }
  html = html.replace(/((西元)?(\d\d{3}年?(－|-|~|～)\d\d{3}年)|\d\d{3}年)/g, "@@@$1"); // add placeholder for year
  html = html.replace(/(<\/sup>)/g, "$1`"); // add placeholder for year

  // real parser
  pattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{0,3}年?)?(－|-|~|～)?([1-9]?[0-9]{0,3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|)).+(<\/(sup|div|p|li|ul)>|<br\s?\/>|。)/g;
  while(m = pattern.exec(html) ){
    if (m.index == pattern.lastIndex) pattern.lastIndex++;
    // special case for wiki reference
    if(m[0].match('`')){
      var h = m[0].replace(/@@@/g, '');
    }
    else{
      // two pass to extract in paragraph
      var h = m[0].replace(/(。|；)/g, "$1@@@"); // add placeholder for sentence
    }
    var ipattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{3}年?)?(－|-|~|～)?([1-9]?[0-9]{3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|))(([^`]{1})+|([^@]{3})+)/g;
    while(mm = ipattern.exec(m[0])){
      if(mm.index == pattern.lastIndex) pattern.lastIndex++;
      if(mm[0]){
        this.extractDate(mm, h);
      }
    }
  }
}

zhdateparser.extractDate = function(m, h){
  var text = m[0];
  var dd = this.option.delimeter;
  var snippet = '';
  var date = {};
  var startDate = endDate = year = '';
  var datestr = text.replace(/<(?:.|\n)*?>/gm, '').match(/(西元)?([1-9]\d{3}年?)?(－|-|~|～)?([1-9]\d{3}?(年代|年|底)?([0-9]{1,2}月|)([0-9]{1,2}日|))/i);
  if(datestr){
    datestr = datestr.shift();
    var title = datestr;
    datestr = datestr.replace('年底','12月31日');

    if(datestr.match('年代')){ // 1990年代
      year = datestr.match(/[1-9][0-9]{0,3}年/);
      if(year){
        startDate = year[0].replace('年', '');
        endDate = parseInt(startDate) + 9;
        endDate = endDate + dd+'12'+dd+'31';
        startDate += dd+'1'+dd+'1';
      }
    }
    if(datestr.match(/(－|-|~|～)/)){ // 1999-2000
      var period = datestr.replace(/.+(－|-|~|～).+/, '=');
      period = period.split('=');
      startDate = period[0].replace(/[^0-9]/, '')+dd+'1'+dd+'1';
      endDate = period[1].replace(/(年|月|日)/g, dd);
    }
    else{ // 1999年9月9日
      startDate = datestr.replace(/(年|月|日)/g, dd);
    }

    var tag = text.match(/<\/(\D+)>$/);
    if(tag){ // end with tag, lookback
      var idxx = m.index;
      var str = h.substr(0, idxx);
      var s = 0;
      while(idxx > 0){
        idxx -= zhdateparser.option.lookback;
        if(s = str.lastIndexOf('<'+tag)){
          snippet = str.substr(s);
          idxx = -1;
        }
        else
        if(s = str.lastIndexOf('。')){
          snippet = str.substr(s+1);
          idxx = -1;
        }
        else
        if(s = str.lastIndexOf('；')){
          snippet = str.substr(s+1);
          idxx = -1;
        }
      }
      snippet = snippet + text;
    }
    else{
      snippet = text;
    }
    // get snippet
    date.startDate = startDate;
    date.endDate = endDate ? endDate : '';
    date.snippet = snippet.replace(/(@@@|`)/g, '');
    date.title = title;
    date.sort = startDate.replace(/[^0-9]/g, '');
    this.push(date);
  }
  snippet = null;
}
zhdateparser.insertYear = function(html, index, string){
  if (index > 0)
    return html.substring(0, index) + string + html.substring(index, html.length);
  else
    return string + html;
}

module.exports = zhdateparser;

String.prototype.zhdataparserinsert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};
