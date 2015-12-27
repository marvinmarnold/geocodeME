Meteor.startup(function() {
  process.env.MAIL_URL = "smtp://" +
    encodeURIComponent(Meteor.settings.GMAIL_USER) +
    ":" +
    encodeURIComponent(Meteor.settings.GMAIL_PASS) +
    "@" +
    encodeURIComponent("smtp.gmail.com") +
    ":465"
});
