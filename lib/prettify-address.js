// TODO:
// * deal with MLK vs martin luther king
// * aliases and special addresses I guess
// * the airport?
// * what about when a space is missing from the streetname and the type like AIRPORTDRIVE
// * or no space after the number like 1AIRPORT DRIVE
// * how about 1 vs ONE
// * IFO -> "In front of"
// * OAKLAND CITY HALL
// * misspelled street type like PLAZA ?
// * BLK ? BLK OF ? BLOCK
// * AND, / , & , AT
// Street names with spaces?
// leading 0s in address numbers?


var _ = require('underscore');
var Parsimmon = require('parsimmon');

// from http://norvig.com/spell-correct.html
var alphabet = 'abcdefghijklmnopqrstuvwxyz';

function splits(word) {
  return _.map(word, function(v, i) {
    return [word.slice(0,i), word.slice(i)];
  });
}

function deletes(word) {
  return _.uniq(_.map(splits(word), function(splits) {
    return splits[0] + splits[1].slice(1);
  }));
}

function transposes(word) {
  return splits(word).filter(function(s) { return s[1].length > 1; }).map(function(s) {
    return s[0] + s[1][1] + s[1][0] + s[1].slice(2);
  });
}

function replaces(word) {
  return _.flatten(splits(word).filter(function(s) { return s[1]; }).map(function(s) {
    return _.map(alphabet, function(letter) {
      return s[0] + letter + s[1].slice(1);
    });
  }));
}

function inserts(word) {
  return _.flatten(splits(word).map(function(s) {
    return _.map(alphabet, function(letter) {
      return s[0] + letter + s[1];
    });
  }));
}

function edits1(word) {
  return _.uniq(_.flatten(_.union(deletes(word), transposes(word), replaces(word), inserts(word))));
}

function known_edits2(word) {
  return _.uniq(_.flatten(_.map(edits1(word), function(e1) {
    return _.intersection(edits1(e1), _.pluck(streets, 1));
  })));
}

function known(words) {
  return _.intersection(words, _.pluck(streets, 1));
}

function correct(word) {
  return _.uniq(_.union(known([word]), known(edits1(word)), known(known_edits2(word))));
}

function correct_all(words) {
  return _.flatten(_.map(words, correct));
}

var data = require('../data/streets.json');
var streets = _.filter(data.streets, function(i) { return i[1]; });
var intersections = data.intersections;

function street_name_bases(name) {
  return _.uniq([name.replace(/\s*(ST|AV[E]*|AVENUE)$/i, '')])
}

function guess_by_type_hints(possibles, original) {
  if (possibles.length === 1) {
    return possibles[0];
  }
  _.each(possibles, function(one) {
    var type = one[2]; // expect name_type to be field 2
    if (type === 'ave' && original.match(/ave/) ||
        type === 'st' && original.match(/st/)) {
      return one;
    }

  });
  return;
}

function correct_street_name(name) {
  var
    name = name.toLowerCase(), // expect name_base from OSM to have been lowercased
    bases = street_name_bases(name),
    possibles = correct_all(bases),
    guess;

  // console.log('name', name);
  // console.log('bases'); console.dir(bases);
  // console.log('possibles'); console.dir(possibles);

  if (possibles.length > 0) {
    name = possibles[0]; // the most likely?
  }

  // find matching name_base
  possibles = _.filter(streets, function(street) {
    return street[1] === name;
  });

  if (possibles.length === 0) {
    return name; // fail
  }

  // match based on name_type
  guess = guess_by_type_hints(possibles, name);
  if (!guess) {
    return name;
  }

  // return the OSM 'name' which includes the unabbreviated name_type
  return guess[0];
}


var digits = Parsimmon.digits;
var letters = Parsimmon.letters;
var regex = Parsimmon.regex;
var string = Parsimmon.string;
var whitespace = Parsimmon.whitespace;
var optWhitespace = Parsimmon.optWhitespace;

//var zip = digits.then(string('-')).then(digits.atLeast(0));

var modifier = regex(/^\s*(BLK|BLK OF|IFO)*\s*/i)

var house_number = regex(/^[0-9]+[ab]*/).skip(optWhitespace);

var street_name = optWhitespace.skip(modifier).then(digits.then(function(numbered_street) {
  return regex(/^(th|st|rd|nd)/i).skip(regex(/^\s*(ST|STREET|AV[E]*|AVENUE)*/i)).map(function(suffix) {
    return numbered_street + suffix; //correct_street_name(numbered_street + suffix);
  });
}).or(regex(/^[a-z\s]*[a-z]+/i)).skip(optWhitespace));


var qualified_address = house_number.then(function(number) {
  return street_name.map(function(name) {
    return number +' '+ correct_street_name(name);
  });
});


var intersection = street_name.skip(whitespace).then(function(first) {
  return street_name.map(function(second) {
    return correct_street_name(first) +' and '+ correct_street_name(second);
  });
});


var address = optWhitespace.then(qualified_address.or(intersection));

exports.zap = function(input) {
  var output = address.parse(input);
  return output;
};


