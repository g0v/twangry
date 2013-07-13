var wiki = {};
wiki.extract = {"timeline":{}};
var test = {
    "timeline":
    {
        "headline":"The Main Timeline Headline Goes here",
        "type":"default",
        "text":"<p>Intro body text goes here, some HTML is ok</p>",
        "asset": {
            "media":"http://yourdomain_or_socialmedialink_goes_here.jpg",
            "credit":"Credit Name Goes Here",
            "caption":"Caption text goes here"
        },
        "date": [
            {
                "startDate":"2011,12,10",
                "endDate":"2011,12,11",
                "headline":"Headline Goes Here",
                "text":"<p>Body text goes here, some HTML is OK</p>",
                "tag":"This is Optional",
                "classname":"optionaluniqueclassnamecanbeaddedhere",
                "asset": {
                    "media":"http://twitter.com/ArjunaSoriano/status/164181156147900416",
                    "thumbnail":"optional-32x32px.jpg",
                    "credit":"Credit Name Goes Here",
                    "caption":"Caption text goes here"
                }
            }
        ],
        "era": [
            {
                "startDate":"2011,12,10",
                "endDate":"2011,12,11",
                "headline":"Headline Goes Here",
                "tag":"This is Optional"
            }

        ],
        "chart": [
            {
                "startDate":"2011,12,10",
                "endDate":"2011,12,11",
                "headline":"Headline Goes Here",
                "value":"28"
            }

        ]

    }
}

wiki.option = {
  domain: 'http://zh.wikipedia.org/',
  api: 'w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=',
  render: 'http://zh.wikipedia.org/w/index.php?&action=render&variant=zh-tw&title='
};
wiki.getPage = function(body) {
  for(var key in body.query.pages);
  var page = body.query.pages[key];
  var revision = page.revisions && page.revisions.shift();
  return revision && revision['*'];
};
wiki.parseDatePage = function(content){
/*
  console.log(body);
  var parsed = '';
  var matches = body.match(/== 月 ==/g);
*/
}
wiki.parseSpecialPage = function(content, page){
  this.parseChineseDate(content);
  return content;
}
wiki.parseChineseDate = function(content){
  var matches = content.match(/([1-2][0-9]{3}年[0-9]{1,2}月.+。)/g);

  if(matches.length){
    matches.forEach(function(date) {
      console.log(date);
//      console.log(content.indexOf(date));
    });
  }
}



module.exports = wiki;
