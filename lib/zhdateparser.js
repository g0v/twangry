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
  option:{lookback:180,delimeter:','},
  dates:[]
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
  html = html.replace(/(\n|\r|\r\n)+(<\/(?:div|p|ul|li)>)/g, '$2');
  html = html.replace(/(<(?:div|p|ul|li|br)[^>]*>)(\n|\r|\r\n)+/g, '$1');
  html = html.replace(/<\/?(th|td|table)[^>]*>\n?/g, '');
  html = html.replace(/<tr.*?>/g, '<p>');
  html = html.replace(/<\/tr.*?>/g, '</p>');
  html = html.replace(/(<[^>]+>)(\d{4}年)(<\/[^>]+>)/g, "$2");
  html = html.replace(/(<[^>]+>)(\d{4}年\d{1,2}月)(<\/[^>]+>)/g, "$2");
  html = html.replace(/(<[^>]+>)(\d{1,2}月\d{1,2}日)(<\/[^>]+>)/g, "$2");
  
  // purge date string in html attributes
  html = html.replace(/(<[^>]+)[0-9]{1,2}月[0-9]{1,2}日([^>]+>)/g, "$1$2");  // date in tag
  html = html.replace(/(<a[^>]*)(?:"(?:年)?[^>]*(?:月)[^"]*")([^>]*>)/g, "$1$2"); // date in tag
  html = html.replace(/(<a[^>]*)[0-9]{4}年([^>]*>)/g, "$1$2"); // date in tag
  
  //Find reference html and main html
  html = ' '+html; 
  var mainstartidx=0;
  var refstartidx=0;
  var refendidx=0;
  var mainhtml=html;
  var refhtml=html;
  var pattern=/<h2><span[^>]*>(.*?)<\/span>/g;
  var HeadlineIndex=0;
  var logstring;
  while(m = pattern.exec(html)){
	  if(HeadlineIndex==0)
	  {
	      mainstartidx=m.index;
	  }
	  if(m[1].match('參考資料') || m[1].match('註釋'))
	  {
		  refstartidx=m.index;
		  mainhtml=html.substr(mainstartidx,refstartidx);
		  var nextm=pattern.exec(html);
		  refendidx=nextm.index;
		  refhtml=html.substr(refstartidx, refendidx);
	  }
	  HeadlineIndex = HeadlineIndex+1;
  }
  
  var idx = 0;
  var lyear = '';
  var date = {};

  // Find string without year. Append year in reference
  html = ' '+html; // in order to make below regular expression work
  pattern = /[^年0-9]([0-9]{1,2})?(－|-|~|～)?[0-9]{1,2}月[0-9]{1,2}日/g;
  while(m = pattern.exec(mainhtml)) {
    if (m.index == pattern.lastIndex) pattern.lastIndex++;
    var dateidx = m[0].match(/^\d/) ? m.index : m.index+1;
	
	var range = mainhtml.substr(dateidx, dateidx+500);
	var brefYear=0;
	var reflink = range.match(/(<sup[^>]+>)(.*?)(<\/sup>)/g);
	if(reflink && reflink[0].match(/<a href="([^"]+)/g)){
		var linkpattern=/<a href="([^"]+)/g;
		var refIDArray=linkpattern.exec(reflink[0]);
		var refID=refIDArray[1].substr(1);
		
		//find reference content and parse date
		var refpattern = new RegExp('(<li[^>]+?id="'+refID+'"+>).+', "g");
		var reference = refhtml.match(refpattern);
		if(reference){
			var refText=reference[0].match(/(<span class="reference-text">)(.*?)(<\/span>)/g);
			if(refText){
				var plaintext = refText[0].replace(/<[^>]+>/g, '');
				var TimePattern = /(西元)?(.{0,1}[1-9][0-9]{0,3}.{0,1})(－|-|~|～|\/|年)(.{0,1}[0-9]{1,2}.{0,1})(－|-|~|～|\/|月)(.{0,1}[0-9]{1,2}.{0,1})(日?)/g;
				var refTime = TimePattern.exec(plaintext);
				if(refTime){
					var year = refTime[0].match(/[1-9][0-9][0-9][0-9]/g);
			        if(year){
						lyear=year[0]+'年';
			            mainhtml = this.insertYear(mainhtml, dateidx, lyear);
						dateidx = dateidx-5;
						brefYear=1;
			        }
				}
			}
		}
	}
	
	
	if(brefYear==0){
		var range = mainhtml.substr(idx, dateidx-idx);
		var years = range.match(/[1-2][0-9]{3}年/g);
    
		if(years){
	      lyear = years.pop();
	      if(lyear){
	        mainhtml = this.insertYear(mainhtml, dateidx, lyear);
	      }
	    }
	}
	
	
    idx = dateidx;
  }

  // Add placeholder to help tokenize
  html = mainhtml.replace(/((西元)?(\d\d{3}年?(－|-|~|～)\d\d{3}年)|\d\d{3}年)/g, "@@@$1"); // add placeholder for year

  // Real parser
  // Phase 1: Find summary start at year, end with specific html tag
  pattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{0,3}年?)?(－|-|~|～)?([1-9]?[0-9]{0,3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|)).+(<\/(p|div|li|ul)>)/g;
  while(m = pattern.exec(html) ){
    if (m.index == pattern.lastIndex) pattern.lastIndex++;
    var tag = m[0].match(/<\/(div|p|li|ul)>$/i);
    var paragraph = '';
    if(tag){
      var temp = html.substr(0, m.index);
      var pretag = '<'+tag[1];
      if(s = temp.lastIndexOf(pretag)){
        paragraph = html.substr(s, m.index-s);
      }
    }

    // use date for the end
    var paragraph = paragraph + m[0].replace(/((?:。|；)(?:<sup.*?<\/sup>)*)/g, "$1@@@"); // add placeholder for sentence
    
    // Phase 2: Find date summary in paragraph.
    // Sometimes we have more than one date description in a paragraph.
    var ipattern = /(<a[^>]+>)?(西元)?([1-9][0-9]{3}年?)?(－|-|~|～)?([1-9]?[0-9]{3}(<\/[^>]+>)?(年代|年|底)(<\/[^>]+>)?([0-9]{1,2}月(<\/[^>]+>)?|)([0-9]{1,2}日|))([^@])+/g;
    while(mm = ipattern.exec(m[0])){
      if(m[0].length - mm[0].length < 10){
        mm[0] = m[0];
      }
      if(mm.index == pattern.lastIndex) pattern.lastIndex++;
      if(mm[0]){
        this.extractDate(mm, paragraph, html, m.index);
      }
    }
  }
}

/**
 * Date object generator
 * @param {object} m - object of match
 * @param {string} paragraph - whole paragraph of original summary. Use for look back
 */
zhdateparser.extractDate = function(m, paragraph, html, mindex){
  var text = m[0];
  var dd = this.option.delimeter;
  var summary = '';
  var date = {};
  var startDate = endDate = year = '';
  
  //var logstring=text.substr(0,100);
  //console.log("@@@@ text start\n %s",logstring);
  
  //logstring=paragraph.substr(0,100);
  //console.log("@@@@ paragraph start\n %s",logstring);

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
    /*
    var pre = html.substr(mindex-s-this.option.lookback, this.option.lookback);
    var post = html.substr(mindex+m[0].length);
    */
    var psplit = paragraph.split('@@@');
    if(psplit){
      var plaintext = text.replace(/<[^>]+>/g, '');
      var pre = '';
      var post = '';
      var start,end;
      for(var i=0; i<psplit.length; i++){
        var plain = psplit[i].replace(/<[^>]+>/g, '');
        if(plain !== ''){
          if(plaintext.indexOf(plain) !== -1){
            if(!start) start = i;
            end = i;
          }
        }
      }

      if(start == end){
        psplit[start] = '<span class="highlighted">' + psplit[start] + '</span>';
      }
      else {
        if(start) {
          psplit[start] = '<span class="highlighted">' + psplit[start];
        }
        else{
          psplit[end] = psplit[end] + '</span>';
        }
      }
      summary = '<span class="fadeout">'+psplit.join('')+'</span>';
      summary = summary.replace(/<\/?(p|div)[^>]*>\n?/g, '');
    }
    else{
      summary = text;
    }

    // look back for section name
    var h = 6;
    var hh;
    var count = 1;
    var section = html.substr(0, mindex);
    var sup = [];
    var fetch;
    while(h > 2){
      if(s = section.lastIndexOf('<h')){
        h = parseInt(section.charAt(s+2));
        fetch = section.substr(s);
        section = section.substr(0, s);
        if(h != hh){
          var sec = fetch.match(/mw-headline.+id="([^"]+)"[^>]*>([^<]+)/);
          if(sec){
            if(sec[1]){
              sup.push('<a class="sup" rel="'+sec[1]+'">['+sec[2]+']</a>');
            }
            else{
              sup.push('['+sec[2]+']');
            }
          }
        }
      }
      hh = h
      if(count > 10) h = 1;
      count++;
    }
    summary = '<sup>'+sup.reverse().join(' • ')+'</sup><br />' + summary;

    // prepare and store date object
    date.startDate = startDate;
    date.endDate = endDate ? endDate : '';  
    date.summary = summary.replace(/@@@/g, '');
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
  if (index > 0){
  	html=html.substring(0, index) + string + html.substring(index, html.length);
	return html;
  }
    
  else
    return string + html;
}

module.exports = zhdateparser;
