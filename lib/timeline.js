/**
 * Timeline object
 * See example format at public/example_json.json
 */
function Timeline()
{
  this.json = { 
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
  };
}

/**
 * Store first layer object
 * @param {string} name - object name
 * @param {*} val - value of object
 */
Timeline.prototype.set = function(name, val){
  if(name !== 'date' && name !== 'chart' && name !== 'era'){
    this.json.timeline[name] = val;
  }
  else{
    this.json.timeline[name].push(val);
  }
};

/**
 * Store second layer object(date)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {string} text
 * @param {object} asset
 * @param {string} tag
 */
Timeline.prototype.setDate = function(startDate, endDate, headline, text, asset, tag, sort){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "text":text,
    "asset":asset,
    "tag":tag,
    "sort":sort
  };
  this.set("date", data);
};
/**
 * Store second layer object(era)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {string} tag
 */
Timeline.prototype.setEra = function(startDate, endDate, headline, tag){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "tag":tag
  };
  this.set("era", data);
};
/**
 * Store second layer object(Chart)
 * @param {string} startDate
 * @param {string} endDate 
 * @param {string} headline
 * @param {*} value 
 */
Timeline.prototype.setChart = function(startDate, endDate, headline, value){
  var data = {
    "startDate":startDate,
    "endDate":endDate,
    "headline":headline,
    "value":value
  };
  this.set("chart", data);
};
/**
 * Get a template of asset object
 * @param {string} media
 * @param {string} credit 
 * @param {string} caption
 */
Timeline.prototype.asset = function(media, credit, caption){
  return a = {
    "media":media,
    "credit":credit,
    "caption":caption
  };
};

Timeline.prototype.computeFirstSlide = function () {
  var startDate = 99999999;
  var tLine = this;
  this.json.timeline.date.forEach(function(date){
    if(startDate > parseInt(date.startDate)){
      var a = date.startDate.split(',', 2);
      tLine.json.timeline.startDate = a[0];
      startDate = a[0];
    }
  });
}

/**
 * Export whole timeline object and purge
 */
Timeline.prototype.exportjson = function(){
  this.computeFirstSlide();
  return JSON.stringify(this.json);
};

function timeline() {
  return new Timeline();
}

module.exports = timeline;
