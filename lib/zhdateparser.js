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

var zhdateparser = {};
zhdateparser.lookback = 100;

zhdateparser.parse = function(html){
  // try to insert year to date only string
  var idx = 0;
  var lyear = '';

  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");
  html = ' '+html; // in order to make below regular expression work
  var pattern = /[^年0-9]([0-9]{1,2})?(－|-|~|～)?[0-9]{1,2}月[0-9]{1,2}日/g;
  while(m = pattern.exec(html)) {
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

  // real parser
  pattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{0,3}年?)?(－|-|~|～)?([1-9]?[0-9]{0,3}(年代|年|底)([0-9]{1,2}月|)([0-9]{1,2}日|)).+(<\/(div|p|li|ul)>|<br\s?\/>|。)/g;
  while(m = pattern.exec(html)){
    var startDate = endDate = year = '';
    var datestr = '';
    for(var i=3; i<=5; i++){
      if(m[i]){
        datestr += m[i];
      }
    }
    datestr = datestr.replace('年底','12月31日');
    if(!datestr.match(/\d+/)) continue;
    
    if(datestr.match('年代')){ // 1990年代
      year = datestr.match(/[1-9][0-9]{0,3}年/);
      if(year){
        startDate = year[0].replace('年', '');
        endDate = parseInt(startDate) + 9;
        endDate = endDAte + ',12,31';
        starDate += ',1,1';
      }
    }
    if(m[3] && m[4] && m[5]){ // 1999-2000
      startDate = m[3].replace(/[^0-9]/, '')+',1,1';
      endDate = m[5].replace(/(年|月|日)/, ',');
    }
    else{ // 1999年9月9日
      startDate = datestr.replace(/(年|月|日)/, ',');
    }

    // get snippet
    var snippet = '';
    if(m[10]){ // end with tag, lookback
      var tag = m[10];
      var idxx = m.index;
      var str = html.substr(0, idxx);
      var s = 0;
      while(idxx > 0){
        idxx -= zhdateparser.lookback;
        if(s = str.lastIndexOf('<'+tag)){
          snippet = str.substr(s);
          idxx = -1;
        }
      }
      snippet = snippet + m[0];
    }
    else{
      snippet = m[0];
    }
  }
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
