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
      "date":[],
      "era":[],
      "chart":[]
    }
  }
}
tl.set = function(name, val){
  if(name !== 'date' && name !== 'chart' && name !== 'era'){
    tl.json.timeline[name] = val;
  }
  else{
    tl.json.timeline[name].push(val);
  }
}
tl.setDate = function(startDate, endDate, headline, text, asset, tag){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "text":text,
    "asset":asset,
    "tag":tag
  };
  tl.set("date", data);
}
tl.setEra = function(startDate, endDate, headline, tag){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "tag":tag
  };
  tl.set("era", data);
}
tl.setChart = function(startDate, endDate, headline, value){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "value":value
  };
  tl.set("chart", data);
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
