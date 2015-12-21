Meteor.methods({
  getGeocode:function(docId, address) {
    check(address, String)
    check(docId, String)

    getGeocode(docId, address)

    return docId
  },
  download: function(docId) {
    check(docId, String)
    var collection = Geocodings.find(
      {docId: docId}, {
        fields: {
          _id: 0,
          address: 1,
          city: 1,
          state: 1,
          zip: 1,
          country: 1
        }
      }
    ).fetch();
    var heading = true; // Optional, defaults to true
    var delimiter = "," // Optional, defaults to ",";
    return exportcsv.exportToCSV(collection, heading, delimiter);
  }
});

var getGeocode = function(docId, address) {
  address = address.split(" ").join("+")
  var apiUrl = "https://api.mapbox.com/geocoding/v5/"
  var endpoint = "mapbox.places/"
  var ending = ".json"//?proximity=-97.13,33.20&access_token=pk.eyJ1IjoidW5wbHVnZ2VkIiwiYSI6IjNlYzFmM2YwZDYzYTM0ZjE5YzYyOGY1OWViM2Q0ODRhIn0.goeHIOasI8pdQeUSY0_Z3Q"
  var arguments = {
    headers: {"User-Agent": "Meteor/1.0"},
    params: {
      "proximity": "-97.13,33.20",
      "access_token":  Meteor.settings.MAPBOX_KEY,
    }
  }
  var requestUrl = apiUrl + endpoint + address + ending
  HTTP.call('GET', requestUrl, arguments, function(error, response) {

    if(response && response.content) {
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

          Geocodings.insert({
            docId: docId,
            address: address,
            city: city,
            state: state,
            zip: zip,
            country: country
          })
        }
      }
    }
  });
}

Meteor.publish("csv", function(docId) {
  return Geocodings.find({docId: docId})
});
