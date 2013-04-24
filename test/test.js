var assert = require('assert');
var _ = require('underscore');

var prettifier = require('../lib/prettify-address.js');
var addresses = require('./addresses.json');

describe('the oakland address prettifier', function() {
  it('should identify all variations of the same address or intersection to actually be the same', function() {
    _.each(addresses, function(matching) {
      var results = _.map(matching, prettifier.zap);
      assert(_.unique(results).length === 1, 'Failed to match '+ matching.join(' with ') +' got '+ results.join(' and '));
      console.dir(_.zip(matching, results));
    });
  });
});
