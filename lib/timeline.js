var tl = {
  "json":{}
};
tl.init = function(){
  tl.json = { 
    "timeline":{
      "headline":null,
      "type":"default",
      "startDate":null,
      "text":null,
      "asset":null,
      "date":[]
    }
  }
}
tl.set = function(name, val){
  if(name !== 'date'){
    tl.json.timeline[name] = val;
  }
  else{
    tl.json.timeline[name].push(val);
  }
}
tl.setDate = function(startDate, headline, text, asset){
  var data = {
    "startDate":startDate,
    "headline":headline,
    "text":text,
    "asset":asset
  };
  tl.set("date", data);
}
tl.asset = function(media, credit, caption){
  return a = {
    "media":media,
    "credit":credit,
    "caption":caption
  };
}
tl.exportjson = function(){
  // set first slide
  var startDate = 99999999;
  tl.json.timeline.date.forEach(function(date){
    if(startDate > parseInt(date.startDate)){
      var a = date.startDate.split(',', 2);
      tl.json.timeline.startDate = a[0];
    }
  });
  return JSON.stringify(tl.json);
}
module.exports = tl;
/*
var template = {
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
*/
