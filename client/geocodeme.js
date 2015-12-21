Template.uploadForm.helpers({
  numLinesParsed: function() {
    return Session.get('linesParsed')
  },
  loc: function() {
    return "/" + Session.get("docId")
  },
  parsingStarted: function() {
    return Session.get('parsingStarted')
  }
});

Meteor.startup(function(){
  Session.setDefault("linesParsed", 0);
  Session.setDefault("parsingStarted", false);
});

Template.uploadForm.events({
  "change #files": function (e) {

    var files = e.target.files || e.dataTransfer.files;
    for (var i = 0, file; file = files[i]; i++) {
      var docId = Random.id()
      Session.set("docId", docId)
      Session.set("parsingStarted", true);
      if (file.type.indexOf("text") == 0) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
          var text = e.target.result;
          var data = Papa.parse(text).data;
          console.log($(this).find('[name=lat]').val());
          // var lat = parseFloat($(this).find('[name=lat]').val())
          // var long = parseFloat($(this).find('[name=long]').val())
          var long = -97.13
          var lat = 33.20
          console.log(lat);
          _.each(data, function(row) {
            if(row[2]) {
              Meteor.call("getGeocode",
              docId,
              row[2],
              lat,
              long,
              function(error, result){
                var lines = Session.get("linesParsed")
                lines++
                Session.set("linesParsed", lines)
              });
            }
          })
        }
        reader.readAsText(file);
      }
    }
  }
})

FlowRouter.route('/', {
  name: 'uploadForm',
  action: function() {
    BlazeLayout.render("mainLayout", {content: "uploadForm"});
  }
});
