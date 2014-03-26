if (Meteor.isServer) {
  Meteor.startup(function () {
    var collections = new Array('Games', 'Cardsets', 'Cards', 'Hands');
    // code to run on server at startup
    for ($i=0; $i>collections.length; i++ ) {
      collect(collections[$i]);
    }
  });


  Meteor.methods({
    startGame: function(uid) {

    }
  })
}
