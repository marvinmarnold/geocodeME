Template.uploadForm.helpers({
  numLinesParsed: function() {
    return Session.get('linesParsed')
  }
});

Meteor.startup(function(){
  Session.setDefault("linesParsed", 0);
});

Template.uploadForm.events({
  "change #files": function (e) {

    var files = e.target.files || e.dataTransfer.files;
    for (var i = 0, file; file = files[i]; i++) {
      var docId = Random.id()
      if (file.type.indexOf("text") == 0) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
          var text = e.target.result;
          var data = Papa.parse(text).data;

          _.each(data, function(row) {
            if(row[2]) {
              Meteor.call("getGeocode", docId, row[2], function(error, result){
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
