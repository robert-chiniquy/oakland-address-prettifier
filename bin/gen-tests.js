#! /usr/bin/env node

var fs = require('fs');
var csv = require('csv');
var _ = require('underscore');

var OUTNAME = __dirname +'/../data/addresses.json';
var CSV_NAME = __dirname + '/../data/USC_GEOCODER.csv';
var fsin = fs.createReadStream(CSV_NAME, {flags: 'r'});

var result = {};
function insert(key, address) {
  if (!address) {
    return;
  }
  result[key] = result[key] || [];
  _.contains(result[key], address) || result[key].push(address);
  result[key].sort();
}

csv()
.on('end', function() {
  // filter out items with only one address
  result = _.values(_.pick(result, _.filter(_.keys(result), function(k) { return result[k].length > 1; })));
  //result.sort(lambda a, b: (a.length + a[0].length) - (b.length + b[0].length));
  result = _.sortBy(result, function(r) { return r.length + r[0].length; });
  var fsout = fs.openSync(OUTNAME, 'w');
  fs.writeSync(fsout, JSON.stringify(result, null, 2));
  process.exit(0);
}).from.stream(fsin)
.transform(function(data){
  insert(data.slice(2,4).join(','), data[0]);
});
