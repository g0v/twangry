/** 
 * you can test string in http://www.gethifi.com/tools/regex
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

/**
 * zhdateparser is core parser for chinese date
 * @constructor
 */
var zhdateparser = {
  option:{lookback:100,delimeter:','},
  date:[]
};

/**
 * Store object to array
 * @param {string} date - date object
 */
zhdateparser.push = function(date){
  this.dates.push(date);
};

/**
 * Export object from array then purge
 */
zhdateparser.dump = function(){
  var r = this.dates;
  this.dates = [];
  return r;
};

/**
 * Real parser
 * @param {string} html - whole html document of page.
 */
zhdateparser.parse = function(html){
  // purge unecessery html
  html = html.replace(/<\/?(th|td)[^>]*>\n?/g, '');
  html = html.replace(/(<[^>]+>)(\d{4}年)(<\/[^>]+>)/g, "$2");
  
  // purge date string in html attributes
  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");  // date in tag
  html = html.replace(/(<[^>]+>)?(\d\d{3}年)(<[^>]+>)?(<[^>]+>)?(\d{1,2}月)(<[^>]+>)?(<[^>]+>)?(\d{1,2}日)(<[^>]+>)?/g, "$2$5$8");

  var idx = 0;
  var lyear = '';
  var date = {};

  // Find string without year. Append year at the front of month and day.
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

  // Add placeholder to help tokenize
  html = html.replace(/((西元)?(\d\d{3}年?(－|-|~|～)\d\d{3}年)|\d\d{3}年)/g, "@@@$1"); // add placeholder for year
  html = html.replace(/(<\/sup>)/g, "$1`"); // add placeholder for year

  // Real parser
  // Phase 1: Find summary start at year, end with specific html tag
  pattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{0,3}年?)?(－|-|~|～)?([1-9]?[0-9]{0,3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|)).+(<\/(sup|div|p|li|ul)>|<br\s?\/>|。)/g;
  while(m = pattern.exec(html) ){
    if (m.index == pattern.lastIndex) pattern.lastIndex++;

    if(m[0].match('`')){
      // special case for wikipedia reference(extreamly ugly)
      var paragraph = m[0].replace(/@@@/g, '');
    }
    else{
      // without any wikipedia reference, use date for the end(buggy here
      var paragraph = m[0].replace(/(。|；)/g, "$1@@@"); // add placeholder for sentence
    }

    // Phase 2: Find date summary in paragraph.
    // Sometimes we have more than one date description in a paragraph.
    var ipattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{3}年?)?(－|-|~|～)?([1-9]?[0-9]{3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|))(([^`]{1})+|([^@]{3})+)/g;
    while(mm = ipattern.exec(m[0])){
      if(mm.index == pattern.lastIndex) pattern.lastIndex++;
      if(mm[0]){
        this.extractDate(mm, paragraph);
      }
    }
  }
}

/**
 * Date object generator
 * @param {object} m - object of match
 * @param {string} paragraph - whole paragraph of original summary. Use for look back
 */
zhdateparser.extractDate = function(m, paragraph){
  var text = m[0];
  var dd = this.option.delimeter;
  var summary = '';
  var date = {};
  var startDate = endDate = year = '';

  // extract whole date string(without summary, only date)
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

    // look back for summary
    var tag = text.match(/<\/(\D+)>$/);
    if(tag){
      var idxx = m.index;
      var str = paragraph.substr(0, idxx);
      var s = 0;
      while(idxx > 0){
        idxx -= zhdateparser.option.lookback;
        if(s = str.lastIndexOf('<'+tag)){
          summary = str.substr(s);
          idxx = -1;
        }
        else
        if(s = str.lastIndexOf('。')){
          summary = str.substr(s+1);
          idxx = -1;
        }
        else
        if(s = str.lastIndexOf('；')){
          summary = str.substr(s+1);
          idxx = -1;
        }
      }
      summary = summary + text;
    }
    else{
      summary = text;
    }

    // prepare and store date object
    date.startDate = startDate;
    date.endDate = endDate ? endDate : '';
    date.summary = summary.replace(/(@@@|`)/g, '');
    date.title = title;
    date.sort = startDate.replace(/[^0-9]/g, '');
    this.push(date);
  }
  summary = null;
}

/**
 * Helper for insert string
 */
zhdateparser.insertYear = function(html, index, string){
  if (index > 0)
    return html.substring(0, index) + string + html.substring(index, html.length);
  else
    return string + html;
}

module.exports = zhdateparser;
