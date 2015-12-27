var processed
var rateLimit
var requestSizes = {}

Meteor.startup(function(){
  processed = 0
  rateLimit = 600 //per minute
  reset()
});

var reset = function() {
  // console.log("reset");
  processed = 0
  processQ()
  Meteor.setTimeout(function () {
    reset()
  }, 1 * 60 * 1000 + 2 * 1000); // a minute + 2 seconds
}

var processQ = function() {
  if(q.find().count() > 0) { // queue isn't empty
    if(++processed <= rateLimit) { // haven't processed more than the limit
      var element = q.findOne()

      // console.log(element);
      // console.log('from q: ' + element.docId + " " + element.address);
      getGeocode(element.docId, element.address, element.lat, element.long, element.i, element.email)

      q.remove(element._id)
      processQ()
    }

  }
}

Meteor.methods({
  getGeocode:function(docId, address, lat, long, i, email) {
    check(address, String)
    check(docId, String)
    check(lat, Number)
    check(long, Number)
    check(i, Number)
    check(email, String)

    if(!requestSizes[docId] || requestSizes[docId] < i)
      requestSizes[docId] = i

    if(++processed <= rateLimit) {
      getGeocode(docId, address, lat, long, i, email)
    } else {
      q.insert({docId: docId, address: address, lat: lat, long: long, i: i, email: email})
    }

    return docId
  },
  download: function(docId) {
    check(docId, String)
    let collection = Geocodings.find(
      {docId: docId}, {
        fields: {
          _id: 0,
          address: 1,
          city: 1,
          state: 1,
          zip: 1,
          country: 1,
          i: 1
        },
        sort: {i: 1}
      }
    ).fetch();
    var heading = true; // Optional, defaults to true
    var delimiter = "," // Optional, defaults to ",";
    // console.log(collection);
    return exportcsv.exportToCSV(collection, heading, delimiter);
  }
});

var getGeocode = function(docId, address, lat, long, i, email) {
  // console.log('getGeocode ' + address);
  address = address.replace(/\./, " ").split(/\s/).join("+")
  var apiUrl = "https://api.mapbox.com/geocoding/v5/"
  var endpoint = "mapbox.places/"
  var ending = ".json"//?proximity=-97.13,33.20&access_token=pk.eyJ1IjoidW5wbHVnZ2VkIiwiYSI6IjNlYzFmM2YwZDYzYTM0ZjE5YzYyOGY1OWViM2Q0ODRhIn0.goeHIOasI8pdQeUSY0_Z3Q"
  var arguments = {
    headers: {"User-Agent": "Meteor/1.0"},
    params: {
      "proximity": long+","+lat,
      "access_token":  Meteor.settings.MAPBOX_KEY,
    }
  }
  var requestUrl = apiUrl + endpoint + address + ending
  // console.log(requestUrl);
  HTTP.call('GET', requestUrl, arguments, function(error, response) {

    if(i === requestSizes[docId]) {
      Email.send({
        to: email,
        from: "GeocodeME <rubetube@gmail.com>",
        subject: "GeocodeME " + i + " addresses (" + docId +")",
        text: Meteor.settings.DOMAIN + docId
      });
    }

    if(response && response.content) {
      // console.log(response);
      var features = JSON.parse(response.content).features
      var addressPat = /^address/
      var place = _.find(features, function(feature) {
        return addressPat.test(feature.id)
      })

      if(!!place) {
        var place = place.place_name.split(",")
        if(!!place) {
          var address = place[0].replace(/^\s+|\s+$/g, '')
          var city = place[1].replace(/^\s+|\s+$/g, '')
          var state = place[2].replace(/^\s+|\s+$/g, '').split(" ")[0]
          var zip = place[2].replace(/^\s+|\s+$/g, '').split(" ")[1]
          var country = place[3].replace(/^\s+|\s+$/g, '')

          // console.log(address);
          // console.log(city);
          // console.log(state);
          // console.log(zip);
          // console.log(country);

          return Geocodings.insert({
            docId: docId,
            address: address,
            city: city,
            state: state,
            zip: zip,
            country: country,
            i: i,
            email: email
          })
        }
      }
    }

    Geocodings.insert({
      docId: docId,
      address: address || "UNKNOWN",
      city: "UNKNOWN",
      state: "UNKNOWN",
      zip: "UNKNOWN",
      country: "UNKNOWN",
      i: i,
      email: email
    })
  });
}

Meteor.publish("csv", function(docId) {
  return Geocodings.find({docId: docId})
});
