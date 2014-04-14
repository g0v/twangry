var nconf = require('nconf');

function Template(){
  this.params = {
    is_front: 0,
    meta_desc: '',
    logo: nconf.get('page:logo'),
    sitename: nconf.get('page:sitename'),
    page_title: nconf.get('page:sitename'),
    mission: nconf.get('page:mission'),
    fb_appid: nconf.get('page:fb_appid'),
    timeline: {
      start_at_end: false,
      start_zoom_adjust: 20
    }
  };
  this.set = function(property, value){
    this.params[property] = value;
  }
  this.get = function(property){
    if(this.params.hasOwnProperty(property)){
      return this.params[property];
    }
    return null;
  }
  this.export = function(){
    return this.params;
  }
}
module.exports = Template;
