/**
 * Timeline object
 * See example format at public/example_json.json
 */
var tl = {
  "json":{}
};

/**
 * Initializer
 */
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

/**
 * Store first layer object
 * @param {string} name - object name
 * @param {*} val - value of object
 */
tl.set = function(name, val){
  if(name !== 'date' && name !== 'chart' && name !== 'era'){
    tl.json.timeline[name] = val;
  }
  else{
    tl.json.timeline[name].push(val);
  }
}

/**
 * Store second layer object(date)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {string} text
 * @param {object} asset
 * @param {string} tag
 */
tl.setDate = function(startDate, endDate, headline, text, asset, tag, sort){
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
/**
 * Store second layer object(era)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {string} tag
 */
tl.setEra = function(startDate, endDate, headline, tag){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "tag":tag
  };
  tl.set("era", data);
}
/**
 * Store second layer object(Chart)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {*} value 
 */
tl.setChart = function(startDate, endDate, headline, value){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "value":value
  };
  tl.set("chart", data);
}
/**
 * Get a template of asset object
 * @param {string} media
 * @param {string} credit 
 * @param {string} caption
 */
tl.asset = function(media, credit, caption){
  return a = {
    "media":media,
    "credit":credit,
    "caption":caption
  };
}
/**
 * Export whole timeline object and purge
 */
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
