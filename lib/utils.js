var fs = require('fs');
var mkdirp = require('mkdirp');

var utils = {};

/**
 * global scope variables
 */
utils.keys = null;

/**
 * Setup environment when first initial
 */
utils.setup = function(){
  utils.checkDirectory('pub/cache/wikipedia');
  utils.checkFile('pub/cache/index.json');
  utils.checkFile('pub/cache/category.json');
}
utils.checkDirectory = function(dir){
  fs.exists(dir, function(exists) {
    if(!exists) {
      mkdirp(dir, function (err) {
        if (err) {
          console.error(err);
        }
      });
    }
  });
}
utils.checkFile = function(path){
  fs.exists(path, function(exists) {
    if(!exists) {
      // TODO, call update to necessery file
    }
  });
}

/**
 * Find keys
 *
 * articles listed in frontpage may combined 
 * diffrent sources this functino return keys
 * found in index.
 *
 * @param string key
 *   key by url, may the wikipedia word or others
 * @return array
 *   keys found in index
 */
utils.keysFind = function(key) {
  if(!utils.keys){
    var data = fs.readFileSync('pub/cache/index.json', 'utf-8');
    if(data){
      var json = JSON.parse(data);
      if(json.hasOwnProperty('wikiArticles')){
        utils.keys = json.wikiArticles;
      }
    }
  }

  // key=>key1,key2,key3
  if(utils.keys.hasOwnProperty(key)){
    return utils.keys[key].split(',');
  }
  // key1+key2+key3=>key1,key2,key3
  else{
    var articles = temp = [];
    key.split('+').forEach(function (k) {
      if(utils.keys.hasOwnProperty(k)){
        temp = utils.keys[k].split(',');
        articles.concat(articles,temp);
      }
    });
    return articles;
  }
}


module.exports = utils;
