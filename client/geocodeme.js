Template.uploadForm.helpers({
  numLinesParsed: function() {
    return Geocodings.find().count()
  },
  parsingStarted: function() {
    return Geocodings.find().count() > 0
  }
});

Template.uploadForm.onCreated(function() {
  var self = this;
  self.autorun(function() {
    var docId = FlowRouter.getParam('docId');
    // console.log(docId);
    if(!!docId) {
      self.subscribe('csv', docId);
    }
  });
});

FlowRouter.route('/:docId', {
    name: 'csv',
    action: function() {
      BlazeLayout.render("mainLayout", {content: "uploadForm"});
    }
});

Template.uploadForm.events({
  "change #files": function (event, template) {
    event.preventDefault()
    var lat = parseFloat(template.find('[name=lat]').value)
    var long = parseFloat(template.find('[name=long]').value)
    var email = template.find('[name=email]').value

    var files = event.target.files || event.dataTransfer.files;
    for (var i = 0, file; file = files[i]; i++) {
      var docId = Random.id()
      FlowRouter.go('/' + docId);
      if (file.type.indexOf("text") == 0) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
          parseCSV(event, docId, lat, long, email)
        }
        reader.readAsText(file);
      }
    }
  },
  'click #download': function(event, template) {
    event.preventDefault()

    var docId = FlowRouter.getParam('docId');
    // console.log(docId);
    if(!!docId) {
      var nameFile = 'geocodeME-' + docId + '.csv';
      // console.log(nameFile);
      Meteor.call('download', docId, function(err, fileContent) {
       if(fileContent) {
         var blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
         saveAs(blob, nameFile);
        //  console.log("saved");
       } else {
         console.log(err);
       }
      });
    }
  }
})

var parseCSV = function (event, docId, lat, long, email) {
  var text = event.target.result;
  var data = Papa.parse(text).data;

  // var long = -97.13
  // var lat = 33.20
  let i = 1
  _.each(data, function(row) {
    if(row[0]) {
      // console.log(row[0]);
      Meteor.call(
        "getGeocode",
        docId,
        row[0],
        lat,
        long,
        i++,
        email,
        function(error, result) {

        });
    }
  })
}

FlowRouter.route('/', {
  name: 'uploadForm',
  action: function() {
    BlazeLayout.render("mainLayout", {content: "uploadForm"});
  }
});
