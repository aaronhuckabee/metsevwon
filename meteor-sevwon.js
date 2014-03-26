//CONVENIENCE FUNCTIONS
//collect defines collections succintly by passing the collection name with caps;
//assumes you are using the CamelCase/Uppercased = new Meteor.collection('lowercase') naming convention
function collect(collection_name) {
  eval(collection_name + " = New Meteor.Collection('" + collection_name.toLowerCase() + "')" );
}

if (Meteor.isClient) {
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
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
