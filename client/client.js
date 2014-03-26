if (Meteor.isClient) {
  //VARIALBLE PREP
  Meteor.startup(function () {
    var collections = new Array('Games', 'Cardsets', 'Cards', 'Hands');
    // code to run on server at startup
    for ($i=0; $i>collections.length; i++ ) {
      collect(collections[$i]);
    }
  });
  uid = Meteor.user()['_id'];

  //CONFIG
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });

  //TEMPLATE OBJECTS
  Template.hello.greeting = function () {
    return "Welcome to meteor-sevwon.";
  };

  Template.hello.events({
    'click input': function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });

  Template.games.loggedIn= function () {
    return Meteor.user();
  };

  Template.games.events({
    'click .startagame': function () {
      // template data, if any, is available in 'this'
      Meteor.call('startGame');
    }
  })

}
