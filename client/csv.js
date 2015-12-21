Template.csv.onCreated(function() {
  var self = this;
  self.autorun(function() {
    var docId = FlowRouter.getParam('docId');
    self.subscribe('csv', docId, function() {
      var nameFile = 'geocodeme-' + docId + '.csv';
      Meteor.call('download', docId, function(err, fileContent) {
       if(fileContent) {
         var blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
         saveAs(blob, nameFile);
       }
      });
    });
  });
});

FlowRouter.route('/:docId', {
    name: 'csv',
    action: function() {
      BlazeLayout.render("mainLayout", {content: "csv"});
    }
});
