the dream
=========

Use a list of known street names and intersections in Oakland to clean up human-entered addresses prior to geocoding to get a higher-quality result.

```javascript
var prettifier = require('oakland-address-prettifier');
prettifier.zap('876 MLK', function(err, prettier) {
  console.log(prettier); // 876 Martin Luther King Jr Way, Oakland, CA 94607
});
```

Even dramatically misspelled street names could be corrected if they occur in intersections, as the cross-street is a big hint.
Bonus: if a street exists only within one ZIP code, the street name lets you supply the ZIP easy.

:warning: reality
=========
* street names all look alike, you need *every single street* in your dictionary to do this right
* A single OSM API bbox query doesn't return all the streets in Oakland (going to planet.osm for this)
* Even Google's geocoder is really bad at disambiguating similar street names in Oakland (discovered building test data). Different places are geocoded the same all the time by everyone.
