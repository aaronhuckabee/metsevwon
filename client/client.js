//CONVENIENCE FUNCTIONS
//collect defines collections succintly by passing the collection name with caps;
//assumes you are using the CamelCase/Uppercased = new Meteor.collection('lowercase') naming convention
function collect(collection_name) {
  eval(collection_name + " = new Meteor.Collection('" + collection_name.toLowerCase() + "');" );
}
Meteor.userLoaded = function() {
    if (Meteor.user() != null && Meteor.user().emails != null) {
      return true;
    } else {
      return false;
    }
}
Meteor.playerPlaying = function() {
  if (Meteor.userLoaded()) {
    game = Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0];
    if (game != null && game.ages != undefined && game.ages[game.ages.length-1] != null) {
      return true
    } else {
      return false;
    }
  }
}
//get current user as game object
Meteor.gamePlayerUser = function() {
  var player, game = Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0];
    _.each(game.playersPlaying, function(value, index, array) {
      if (value.uid == Meteor.userId()) {
        player = value;
      }
    });
  return player;
}
Meteor.playerGameId = function() {
  response = "";
  try {response = Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0]._id} catch(e) {console.log(e)};
  return response
}
Meteor.playerGame = function() {
  return Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0];
}
Meteor.playerHandId = function() {
  var game = Meteor.playerGame();
  var playerIndex;
  _.each(game.playersPlaying, function(value, index, array) {
    if (value.uid == Meteor.userId()) {
      playerIndex = index;
    }
  });
  var handCursor = Cardsets.find({_id:_.compact(game.ages)[0]});
  var handId = handCursor.fetch()[0][((game.grandIndex + playerIndex) % game.playersPlaying.length) + 1];
  return handId;
}

Session.set('playerGameId', ((typeof Games == 'object') ? Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0]._id : 'frank'));
Meteor.playerIndex = '';

//DEBUG Vars
Debug = {
  verifyPlayable: false,

}

if (Meteor.isClient) {
  //VARIALBLE PREP
  email = {valueOf: function() {
    return Meteor.user().emails[0].address;
  }}


  var collections = new Array('Games', 'Wonders', 'Cardsets', 'Cards', 'Hands');
  // code to run on server at startup
  for ($i=0; $i<collections.length; $i++ ) {
    collect(collections[$i]);
  }

  Meteor.startup(function () {

  });

  //CONFIG
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });

  //TEMPLATE OBJECTS
  //Games Template
  Template.games.loggedIn= function () {
    return Meteor.user();
  };
  Template.games.notInGame= function() {
    if (Meteor.userLoaded()) {
      return (0 == Games.find({playersPlaying: {uid: Meteor.userId(), email: email.valueOf()}}).fetch().length);
    }
    return true;
  }
  Template.games.game = function() {
    var games = Games.find({}).fetch();
    if (games.length != 0) {
      return games;
    }
  }
  Template.games.yourGame = function() {
    return Games.find({playersPlaying: {uid: Meteor.userId(), email: email.valueOf()}}).fetch();
  }

  Template.games.events({
    'click .startaroom': function () {
      // template data, if any, is available in 'this'
      Meteor.call('startRoom', Meteor.userId(), email.valueOf());
    }
  })
  Template.games.events({
    'click .joinagame': function (event) {
      gid = this._id;
      Meteor.call('joinGame', gid, Meteor.userId(), email.valueOf());
    }
  })

  Template.game.gameStarted = function() {
    try {
      if ( typeof Games.findOne({_id: Meteor.playerGameId}).grandIndex != "number") {
        return true;
      }
    } catch (e) {
      console.log(e);
    }
    return false;
  }
  Template.game.loggedIn= function () {
    return Meteor.user();
  };
  Template.game.user= function () {
    return Meteor.gamePlayerUser();
  }
  Template.game.yourGame = function() {
    if (Meteor.userLoaded()) {
      return Games.find({'playersPlaying.uid': Meteor.userId()}).fetch();
    } else {
      return [];
    }
  }
  Template.game.wonderSelected = function() {
    return Meteor.gamePlayerUser().wonderSelected;
  }
  Template.game.yourCards= function() {
    if (Meteor.userLoaded()) {
      var game = Games.findOne({'playersPlaying.uid': Meteor.userId()});
      var playerIndex;
      _.each(game.playersPlaying, function(value, index, array) {
        if (value.uid == Meteor.userId()) {
          playerIndex = index;
        }
      });
      var handCursor = Cardsets.find({_id:_.compact(game.ages)[0]});
      try {
        var handId = handCursor.fetch()[0][((game.grandIndex + playerIndex) % game.playersPlaying.length) + 1];
      }
      catch(err)
      {
        return handCursor.fetch();
      }
      if (Hands.find({_id:handId}).fetch()[0] != undefined) {
        var hand = Hands.find({_id:handId}).fetch()[0].cards;
        var cards = [];
        _.each(hand, function(value, index){
         cards.push(Cards.find({_id: value}).fetch()[0]);
        })
        return cards;
      }
    }
    return [];
  }
  Template.game.wonder = function() {
    if (Meteor.playerPlaying()) {
      var player = Meteor.gamePlayerUser();
      wonder = player.wonder;
      console.log(wonder);
      if (Meteor.gamePlayerUser().wonderSelected) {
        var selected = player.wonderSelected;
        wonderFull = Wonders.find({_id:player.wonder}).fetch()[0];
        if (selected == 'a') {
          wonderFull.b = null;
        } else {
          wonderFull.a = null;
        }
        return wonderFull;
      } else {
        return Wonders.find({_id:player.wonder}).fetch()[0];
      }
    }
  }
  Template.game.cardSelected= function() {
    if (Meteor.userLoaded() && Meteor.playerGameId() && Meteor.playerHandId() && Hands.findOne({_id: Meteor.playerHandId()}).selected ) {
      return Cards.findOne({_id: Hands.findOne({_id: Meteor.playerHandId() }).selected});
    }

    return null;
  }
  Template.game.yourGame.playersPlaying = function() {
    return [];
  }
  Template.game.threePlus = function() {
    //makes sure that there's an allowable number of players to start a game
    return ([3, 4, 5, 6, 7].indexOf(Games.find({'playersPlaying.uid': Meteor.userId()}).fetch()[0].playersPlaying.length) != -1);
  }
  Template.game.cardsPlayedColor = function() {
    user = Meteor.gamePlayerUser();
    var returnSorted = [];
    _.each(user.cardsOrganized, function(colorset, index, list){
      var populatedCardSet = [];
      for (var index2 in colorset.cards) {
        populatedCardSet.push(Cards.findOne({_id: colorset.cards[index2]}));
      }
      user.cardsOrganized[index].cards = populatedCardSet;
    });
    return user.cardsOrganized;
  }
  Template.game.events({
    'click .startagame': function (event) {
      gid = this._id;
      Meteor.call('startGame', gid);
    },
    'click .hand .card': function(event) {
      cardId = event.currentTarget.id;
      console.log(cardId);
      card = Cards.find({_id: cardId}).fetch()[0];
      player = Meteor.gamePlayerUser();

      if (!(inherited(card, player))) {
        playableState = verifyPlayable(card, player);
        if (playableState =='notPlayable') {
          console.log('you cannot play dis cerd'); //TODO: present this a little more prevalently
          return "";
        } else if (playableState =='playableWithNeighbors') {
          //TODO:neighbor buying interface & template & whatnot
          console.log('playableWithNeighbors');
          return "";
        }
      }
      console.log('playable');
      if (checkBabylon()) {
        babylonArray ='blahblahjh'
      } else { babylonArray = 'a'}
      var gid = Meteor.playerGameId();
      Meteor.call('playCard', gid, player.uid, Meteor.playerHandId(),  cardId, card, player,  babylonArray);
    },
    'click .hand .card .discard': function(event) {
      cardId = event.currentTarget.parentElement.id;
      Meteor.call('disCard', Meteor.playerGame()._id, Meteor.gamePlayerUser().uid, _.compact(Meteor.playerGame().ages)[0], Meteor.playerHandId(),  cardId);
      event.stopPropagation();
    },
    'click .wonder-candidate':function(event) {
      Meteor.call('pickWonderSide', Meteor.playerGameId(), Meteor.userId(), event.currentTarget.id)
    },
    'click .buy-interface submit': function(event) {
      //meteor.call(attemptSelect, gid, uid, cid, purchasePattern)
    },
    'click .buy-interface cancel': function(event) {
      //close interface, successfully return to turn-taking view
    }

  })
  //HELPERS
  Handlebars.registerHelper("getHashHex", function(hash) {
   return '#' + (parseInt(parseInt(hash, 36).toExponential().slice(2,-5), 10) & 0xFFFFFF).toString(16).toUpperCase().slice(-6);
  });
  Handlebars.registerHelper("getKey", function(chainTo) {

    var processed = "<div class='chainTo-wrapper'>";
    if (typeof chainTo == 'string') {
      processed += "<div class='card-chainTo'>" + chainTo + "</div>";
    } else {
      processed += "<div class='card-chainTo'>" + chainTo[0] + "</div>";
      processed += "<div class='card-chainTo'>" + chainTo[1] + "</div>";
    }
    processed += "</div>";
    return processed;
  });
  Handlebars.registerHelper("processChainTo", function(chainTo) {

    var processed = "<div class='chainTo-wrapper'>";
    if (typeof chainTo == 'string') {
      processed += "<div class='card-chainTo'>" + chainTo + "</div>";
    } else {
      processed += "<div class='card-chainTo'>" + chainTo[0] + "</div>";
      processed += "<div class='card-chainTo'>" + chainTo[1] + "</div>";
    }
    processed += "</div>";
    return processed;
  });
  Handlebars.registerHelper("processResources", function(resourceBit) {
    var result = "";
    try {
      if (resourceBit.length == 8) {

        var beginning = "<p class=\"resource ";
        var end = "\"> </p>";
        var resourceArray = new Array('stone', 'ore', 'brick', 'wood', 'textile', 'glass', 'papyrus', 'coin');

        _.each(resourceBit, function(value, index, list) {
          if (value > 0) {
            for (var i = value; i > 0; i--) {
              result += beginning + resourceArray[index] + end;
            }
          }

        })
      }
    }
    catch(e) {
      console.log(e);
    }

    if (typeof resourceBit == 'object') {
      //treatment for Ors
        var beginning = "<p class=\"resource ";
        var end = "\"> </p>";
        var resourceArray = new Array('stone', 'ore', 'brick', 'wood', 'textile', 'glass', 'papyrus', 'coin');
        result += '<div class="or">';
      _.each(resourceBit, function(resourceString, index, list){
        _.each(resourceString, function(value, index, list) {
          if (value > 0) {
            for (var i = value; i > 0; i--) {
              result += beginning + resourceArray[index] + end;
            }
          }
        })
        result += '/';
      })
      result = result.slice(0, -1); //trims off final trailing slash. Only other way I can think to do this is to build backwards and set a bit
      result += '</div>';
    }
    return result;
  });

  Handlebars.registerHelper("processBoons", function(boonBit) {

    var returnValue = "";
    if (boonBit.toString().length == 3) {
      var wheresTheX = boonBit.indexOf('x');
      if (wheresTheX != -1) {
        //fancier processing to represent variables
      } else {
        resultKeys = {0: 'military', 1: 'vp', 2: 'coin'};
        _.each(boonBit, function (value, index, list) {
          if (value != 0 ) {
            if (index == 0) {//special case military, as all tokens are shown, not just number
              while (value > 0) {
                returnValue += "<div class='boon " + resultKeys[index] + "'></div> "
                value -= 1;
              }
            } else {
              returnValue += "<div class='boon " + resultKeys[index] + "'>" + value + "</div> "
            }
          }
        });
      }
    } else if (typeof boonBit == "number") {
      returnValue = "<p class='vp'>" + boonBit + "vp</p>";
    } else {
      switch (boonBit) {
        case "tradebasicleft":
              returnValue += "<div class='trade-wrapper'><div class='resource brick'></div><div class='resource stone'></div><div class='resource wood'></div><div class='resource ore'></div></div><div class='arrows'> <p class='left-triangle'></p></div>"
          break;
        case "tradebasicright":
              returnValue += "<div class='trade-wrapper'><div class='resource brick'></div><div class='resource stone'></div><div class='resource wood'></div><div class='resource ore'></div></div><div class='arrows'> <p class='right-triangle'></p></div>"
          break;
        case "tradebasic":
              returnValue += "<div class='trade-wrapper'><div class='resource brick'></div><div class='resource stone'></div><div class='resource wood'></div><div class='resource ore'></div></div><div class='arrows'> <p class='left-triangle'></p><p class='right-triangle'></p></div>"
          break;
        case "tradeadv":
              returnValue += "<div class='trade-wrapper'><div class='resource textile'></div><div class='resource glass'></div><div class='resource papyrus'></div></div><div class='arrows'> <p class='left-triangle'></p><p class='right-triangle'></p></div>"
          break;
        case "anybasic":
              returnValue += "<div class='boonBit'><div class='resource ore'></div>/<div class='resource stone'></div>/<div class='resource brick'></div>/<div class='resource wood'></div></div></div>"
          break;
        case "anyadv":
              returnValue += "<div class='" + boonBit + "'><p class='resource textile'></p>/<p class='resource papyrus'>/</p><p class='resource glass'></p></div> "
          break;
        case "anytech":
              returnValue += "<div class='" + boonBit + "'><p class='tech compass'></p> <p class='tech gear'></p><p class='tech tablet'></p></div> "
          break;
        case "buildfree":
              returnValue += "<div class='" + boonBit + "'>" + boonBit + "</div>"
          break;
        case "copyguild":
              returnValue += "<div class='" + boonBit + "'>" + boonBit + "</div>"
          break;
        case "graveyard":
              returnValue += "<div class='" + boonBit + "'>" + boonBit + "</div>"
          break;
      }

    }
    return returnValue;
  });
  function inherited(card, player) {
    var inherited = false;
    if (card.chainFromId) {
      _.each(card.chainFromId,  function(value, index){
        if (player.cardsPlayed.indexOf(value) != -1) {
          var inherited = true;
        }
      })
    }
    return inherited;
  }
}


function verifyPlayable(card, player) {
  //easy check
  if (card.cost.indexOf("0000000") == 0) {
    if (player.coins > card.cost.slice(-1)) {
      return "playable";
    } else {
      return "notPlayable";
    }
  }

  //check for basic compatibility
  var payResults = [];
  _.each(player.payArray, function(paySet, index) {
    if (Debug.verifyPlayable) { console.log("paySet: " + paySet + "cost: " + card.cost) }
    var payResult = "";
    for (var i = 0; i < card.cost.length; i++ ) {
      if (Debug.verifyPlayable) { console.log("i: " +  i); }
      if (paySet[i] >= card.cost[i]) {
        payResult += '0';
        if (Debug.verifyPlayable) { console.log('zeroed: '+  paySet[i] + " vs " + card.cost[i]); }
      } else {
        payResult += (card.cost[i] - paySet[i]).toString();
        if (Debug.verifyPlayable) { console.log('notZeroed'); }
      }
    }
    if (Debug.verifyPlayable) { console.log('payResult: ' + payResult); }
    payResults.push(payResult);
  })

  if (checkPayResults(payResults)) {
      return checkPayResults(payResults);
  }

  //TODO:check for anybasic, anyadv,
  if (checkPayResults(payResults)) {
      return "playable";
  }

  //TODO:check neighbor's payArray in conjunction with local coins,
  if (checkPayResults(payResults)) {
      return "playableWithNeighbors";
  } else {
    return "notPlayable"
  }

}
function checkBabylon() {
  //TODO: yeah, this
  return false
}

function checkPayResults(payResults) {
  if (payResults.indexOf("00000000") != -1) {
    return true;
  } else {
     return false;
  }
}
