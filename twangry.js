var http = require('http');
var nconf = require('nconf');

// set gloabl configuration
nconf.argv();
nconf.env();
nconf.file({ file: 'conf/'+nconf.get('NODE_ENV')+'.json' });

// first initial setup
var utils = require(nconf.get('base')+'/lib/utils');
if(!nconf.get('setup')){
  utils.setup();
  nconf.set('setup', 1);
}

var route = require(nconf.get('base')+'/lib/route');
var server = http.createServer(function(req, res){
  route.run(req, res);
  req.on('error', function (err) {
    console.log(err);
  });
})
.on('connection', function (conn) { 
  conn.setNoDelay(true); 
})
.listen(nconf.get('port'));

console.log('server is working on port ' + nconf.get('port'));
