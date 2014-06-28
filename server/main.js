//CONVENIENCE FUNCTIONS
//collect defines collections succintly by passing the collection name with caps;
//assumes you are using the CamelCase/Uppercased = new Meteor.collection('lowercase') naming convention
function collect(collection_name) {
  eval(collection_name + " = new Meteor.Collection('" + collection_name.toLowerCase() + "');" );
}

//DEBUG Vars
Debug = {
  //playAllCards: true,
  //payArray: true,
}

//Shorthands: cid:cardID, hid:handId, uid:userId, gid:gameId

if (Meteor.isServer) {

  //VARIALBLE PREP
  var collections = new Array('Games','Wonders', 'Cardsets', 'Cards', 'Hands');
  // code to run on server at startup
  for ($i=0; $i<collections.length; $i++ ) {
    collect(collections[$i]);
  }

  Meteor.startup(function () {
    Games.remove({});;
    Cardsets.remove({});
    Hands.remove({});

    //defineWonders();
    //defineCards();
  });

  Meteor.methods({
    startRoom: function( uid, email) {
      uids = new Array( { uid: uid
      , email: email
      });
      var playersPlaying = {playersPlaying: uids};
      Games.insert(playersPlaying);
    },
    joinGame: function(gid, uid, email) {
      //var game = Games.finds({_id: gid});
      //game.playersplaying.append(uid);
      Games.update({_id: gid},
         {$push: {playersPlaying: {uid: uid, email:email}}});
    },
    startGame: function(gid) {
      var game = Games.find({_id: gid}).fetch()[0];
      var players = game.playersPlaying;

      game = assignWondersCoinsEtc(game);
      game.ages = prepCardSets(gid, players.length);
      game.grandIndex = Math.floor(Math.random()* players.length);
      game.playersReady = 0;
      game.discard = [];

      Games.update({_id:gid}, game);

    },
    pickWonderSide: function(gid, uid, side) {
      var game = Games.find({_id: gid}).fetch()[0];
      _.each(game.playersPlaying, function(value, index, list) {
        if (value.uid == uid) {
          if(!value.wonderSelected) {
            game.playersPlaying[index].wonderSelected = side;
            var wonder = Wonders.find({_id:value.wonder}).fetch()[0];
            var resource = eval('wonder.' + side).resource;
            var boon = eval('wonder.' + side).boon;
            game.playersPlaying[index].payArray = [resource];
            game.playersPlaying[index].boons = boon;
          } else {
            return;
          }
          Games.update({_id:gid}, game);
        }
      });

    },
    playCard: function(gid, uid, hid, cid, card, player, babylonArray) {
      //verifyExistence(return cIndex TODO: actually verify server-side, don't rely on passed card/player objs
      //else setErrorUser(uid);currently are just assuming client-side checks passed successfully

      //increment playersReady
      if (!Hands.findOne(hid).selected) {
        Games.update({_id:gid}, {$inc: {playersReady: 1}});
      }
      var game = Games.find({_id:gid}).fetch()[0];

      //set hand property: selected to card id
      Hands.update({_id:hid}, {$set:{selected:cid}});

      //if allplayersready playallcards
      console.log(game.playersReady + " == "  + game.playersPlaying.length);
      if (game.playersReady >= game.playersPlaying.length) {
        playAllCards(game, _.compact(game.ages)[0]);
      }
    },
    disCard: function(gid, uid, aid, hid, cid) {
      //TODO: verify shizzle foRizzle
      Hands.update({_id:hid}, {$set:{discard:cid}});
      Games.update({_id:gid}, {$inc:{playersReady: 1}});
      game = Games.findOne({_id:gid});
      if (game.playersReady >= game.playersPlaying.length){
        playAllCards(game, _.compact(game.ages)[0]);
      }
    },
  })
}
function tallyPoints() {
  //set Game:ended
  //foreach user tally military
  //foreach user tally coins
  //foreach user tally wonders
  //foreach user tally blues
  //foreach user tally yellows
  //foreach user tally purples
  //foreach user tally greens
  //foreach user tally total
  //update users
}

function roundEnd(game, ageId) {
  //discardRemaining,
  handList = Cardsets.findOne({_id: ageId});
  _.each(handList, function(value, index) {
    if (index != '_id') {
      game.discard.push(Hands.findOne({_id:value}).cards[0]);
      Hands.remove({_id:value});
    }
  });

  //remove Cardset
  Cardsets.remove({_id: ageId});

  //set age to Null
  ageoffset = 4 - _.compact(game.ages).length;
  game.ages[ageoffset] = null;

  //resolve military
  //calculateMilitary(game);//mostly written out, untested, needs a little verk.

  //if lastroundended
  if (_.compact(game.ages).length == 0) {
    tallyPoints(game);
  }

  Games.update({_id:game._id}, game);
}
function calculateMilitary(game) {

  var tokenValue;
  switch (_compact(game.ages).length) {
    case 2:
      tokenValue = 1;
      break;
    case 1:
      tokenValue = 3;
      break;
    case 0:
      tokenValue = 5;
      break;
  }

  _.each(game.playersPlaying, function(player, index, list) {
    getMilitaryScore(player);
  });
  _.each(playersPlaying, function(player, index, list) {
    if (index != game.playersPlaying.length -1) {
      if (player.militaryPoints > list[index+1].militaryPoints) {
        player.militaryTokens.push(tokenValue);
        list[index+1].militaryTokens.push(-1);
      } else if (player.militaryPoints > list[index+1].militaryPoints) {
        player.militaryTokens.push(-1);
        list[index+1].militaryTokens.push(tokenValue);
      }
    }
  });

  return game;
}
function playAllCards(game, ageId) {

  cardset = Cardsets.find({_id: ageId }).fetch()[0];
  console.log(cardset);
  var cardsLeft;
  _.each(cardset, function(handId, cardsetIndex, list) {

    //in case of no selected card (discard, wonder played)
    if (list[cardsetIndex] == list._id) {
      if (Debug.playAllCards) { console.log('skip id property processing ' + cardsetIndex); }
      return "";
    }

    var hand = Hands.find({_id:handId}).fetch()[0];
    playerIndex = parseInt(cardsetIndex - game.grandIndex -1 + game.playersPlaying.length*100)%(game.playersPlaying.length);

    //DEBUGGING
    if (Debug.playAllCards) { console.log('cardsetIndex:' +cardsetIndex); console.log('handId:' + handId); console.log('hand' + Hands.find({_id:handId}).fetch()); }

    //handle discard
    if (hand.discard) {
      var discard = hand.discard;
      game.discard.push(hand.discard);
      game.playersPlaying[playerIndex].coins += 3;
      //remove from hand's cardlist
      Hands.update({_id: handId}, {$pull:{cards: discard }});
      //hand no longer has card discard selected
      Hands.update({_id:handId}, {$unset:{discard: ""}});
      return "";
    }

    //get cid
    var playerIndex, selected = Hands.find({_id:handId}).fetch()[0].selected;

    //DEBUGGING
    if (Debug.playAllCards) { console.log('selected: ' + selected); console.log('playersPlaying: ' + game.playersPlaying); console.log(typeof index + " + " + typeof  game.grandIndex + " % " +typeof  game.playersPlaying.length); console.log(index + (game.grandIndex)%(game.playersPlaying.length )); console.log(game.playersPlaying[index + (game.grandIndex)%(game.playersPlaying.length )]); }

    //assign to user
    game.playersPlaying[playerIndex].cardsPlayed.push(selected);
    var cardColor = Cards.findOne({_id: selected}).color + 's';
    var colorArray = [//this should (rather pointlessly, albeit) match the corresponding colors in assignWondersCoinsEtc
      'greys',
      'browns',
      'yellows',
      'reds',
      'blues',
      'greens',
      'purples',
    ];
    var colorIndex = colorArray.indexOf(cardColor);
    game.playersPlaying[playerIndex].cardsOrganized[colorIndex]['cards'].push(selected);
    game.playersPlaying[playerIndex].payArray = getPayArray(game.playersPlaying[playerIndex]);

    //remove from hand's cardlist
    Hands.update({_id: handId}, {$pull:{cards: selected}});
    //hand no longer has card selected
    Hands.update({_id:handId}, {$unset:{selected: ""}});
    //set variable while data's here on 1st processed


    if (cardsetIndex == 1) {
      //DEBUGGING
      if (Debug.playAllCards) { console.log('setting Cardsleft: ' + Hands.find({_id:handId}).fetch() ); }

      cardsLeft = Hands.find({_id:handId}).fetch()[0].cards.length;
    }

  });
  game.playersReady = 0;
  game.grandIndex ++;

  Games.update({_id:game._id}, game);
  if (cardsLeft <= 1) {
    roundEnd(game, ageId);
  }
}

function assignWondersCoinsEtc(game) {
  wonders = Wonders.find({}).fetch();
  wonders = _.shuffle(wonders);
  _.each(game.playersPlaying, function(player, offset, list){
    game.playersPlaying[offset].wonder = wonders[offset]._id;
    game.playersPlaying[offset].coins = 3;
    game.playersPlaying[offset].stagesBuilt = 0;
    game.playersPlaying[offset].cardsPlayed = [];
    game.playersPlaying[offset].militaryTokens= [];
    game.playersPlaying[offset].cardsOrganized = [
      { color: 'greys', cards: [] },
      { color: 'browns', cards: [] },
      { color: 'yellows', cards: [] },
      { color: 'reds', cards: [] },
      { color: 'blues', cards: [] },
      { color: 'greens', cards: [] },
      { color: 'purples', cards: [] },
    ];
  })
  return game;
}

function getPayArray(playerObj) {
  var simples = [];
  var ors = [];
  if (Debug.payArray) {
    console.log("gpa cards: " + playerObj.cardsPlayed);
    console.log("gpa typeof cards: " + typeof playerObj.cardsPlayed);
    console.log("gpa player: " + playerObj.uid);
  }
  _.each(playerObj.cardsPlayed, function(cid, index, list){
    var card = Cards.find({_id:cid}).fetch()[0];
    if (Debug.payArray) {
      console.log("gpa cardid: " + cid);
      console.log("gpa card: " + card);
    }
    if (['grey', 'brown'].indexOf(card.color) >= 0) {
      if (typeof (card.resource) == 'string') {
        console.log('simple: ' + card.color + " " + typeof card.resource + " " + card.resource + " " + card._id);
        simples.push(card.resource);
      } else {
        console.log('or: ' + card.color + " " + typeof card.resource + " " + card.resource + " " + card._id);
        ors.push(card.resource);
      }
    }
  });
  var wid = playerObj.wonder;
  var wside = playerObj.wonderSelected;

  simples.push(Wonders.find({ _id: wid}).fetch()[0][wside].resource);

  console.log("simples: " + simples);
  console.log("ors: " + ors);
  var endValue = 0;
  _.each(simples, function(value, index, list) {
    endValue += parseInt(value);
  })
  endValue = endValue.toString();
  while (endValue.length < 8 ) {
    endValue = '0' + endValue;
  }
  endValue = [endValue];

  if (ors[0] == undefined) {
    console.log('gpa simple payArray: ' + endValue);
    return endValue;
  }
  var finalValue = [];
  _.each(ors, function(orArray, index, list) {
    console.log('orArray: ' + orArray);
    if (finalValue[0] == undefined) {
      finalValue = ors[0];
      ('first "or" pushed to finalValue');
    } else {
      var tempFinal = [];
      _.each(orArray, function(orValue, index, list) {
        _.each(finalValue, function(endBit, index, list) {
          tempFinal.push(combinePay(endBit, orValue));
        })
      })
      finalValue = tempFinal;
    }
  })
  console.log('finalValue after 1st process: ' + finalValue);
  tempFinal = [];

  console.log("finalValue[0]: " + finalValue[0]);
  _.each(finalValue, function(value, index, list) {
    tempFinal.push(combinePay(value, endValue));
    console.log("finalvalue[" + index + "] = " + finalValue[index]);
  });
  finalValue = tempFinal;

  console.log('finalValue after 2nd process: ' + finalValue);

  return finalValue;

}
function combinePay(a, b) {
  number = (parseInt(a) + parseInt(b)).toString();
  while (number.length < 8) {
    number = "0" + number;
  }
  console.log("combinePay result: " + number);
  return number;
}

function prepCardSets(gid, numberOfPlayers) {
  ages = [];
  for ($age = 1; $age <= 3; $age ++) {
    ageset = [];
    for (var i = 3; i <= numberOfPlayers; i++ ) {
      ageset = ageset.concat(Cards.find({minPlayers: i, age: $age}, {fields:{_id:1}}).fetch());
    }

    if ($age == 3) {
      var guilds = Cards.find({color: 'purple'}, {fields:{_id:1}}).fetch();
      guilds = _.shuffle(guilds)
      guilds = _.shuffle(guilds)
      guilds = _.shuffle(guilds)
      ageset = ageset.concat(guilds.slice(0, numberOfPlayers + 2));
    }
    intoIds = [];
    _.each(ageset, function(cardObj){
      intoIds.push(cardObj._id);
    })
    ageset = intoIds;


    //at least three shuffles, perhaps infinity shuffles
    ageset = _.shuffle(ageset);
    ageset = _.shuffle(ageset);
    shufcount = 0
    do {
      ageset = _.shuffle(ageset);
      shufcount ++;
    }
    while (Math.random() > 0.7);

    cardset = [];
    cardsPerHand = ageset.length/numberOfPlayers;
    for (var i = 1; i <= numberOfPlayers; i++ ) {
      cardset[i] = Hands.insert({cards: ageset.slice(cardsPerHand*(i-1), cardsPerHand*i)});
    }
    ages[$age] = Cardsets.insert(cardset);
  }
  return ages;
}

function verifyPlayable() {
  //process rules: abstract rules that deal with determining the outcome, but don't present information to the player
  //that they wouldn't otherwise have to calculate themselves
  //comparison costs are 'bitwise' operaters of a string of numbers representing the costs required
  //ore, stone, brick, wood, textile, glass, papyrus, coins
  //use instanceof Array to detect more particular boons . . .

  if (card.chainFrom && cardsPlayed.indexOf(card.chainFrom) != -1) {
    return true;
  }
}

function defineWonders() {
  var wonders = [
    {
      name: 'The Pyramids of Giza',
      a:{
        resource: '01000000',
        stage1 : { cost: '02000000', boon: 3, },
        stage2 : { cost: '00030000', boon: 5, },
        stage3 : { cost: '04000000', boon: 7, },
      },
      b:{
        resource: '01000000',
        stage1 : { cost: '00020000', boon: 3, },
        stage2 : { cost: '03000000', boon: 5, },
        stage3 : { cost: '00300000', boon: 5, },
        stage4 : { cost: '04000010', boon: 7, },
      },
    },
  {
    name: 'The Hanging Gardens of Babylon',
    a:{
      resource: '01000000',
      stage1 : { cost: '00200000', boon: 3, },
      stage2 : { cost: '00030000', boon: 'anytech', },
      stage3 : { cost: '00400000', boon: 7, },
    },
    b:{
      resource: '01000000',
      stage1 : { cost: '00101000', boon: 3, },
      stage2 : { cost: '00020100', boon: 'lasttwo', },
      stage3 : { cost: '00300010', boon: 'anytech', },
    },
  },
  {
    name: 'The Temple of Artemis in Ephesus',
    a:{
      resource: '00000010',
      stage1 : { cost: '02000000', boon: 3, },
      stage2 : { cost: '00020000', boon: '009', },
      stage3 : { cost: '00000020', boon: 7, },
    },
    b:{
      resource: '00000010',
      stage1 : { cost: '02000000', boon: '024', },
      stage2 : { cost: '00020000', boon: '034', },
      stage3 : { cost: '00001110', boon: '054', },
    },
  },
  {
    name: 'The Colossus of Rhodes',
    a:{
      resource: '10000000',
      stage1 : { cost: '00020000', boon: 3, },
      stage2 : { cost: '00300000', boon: '200', },
      stage3 : { cost: '40000000', boon: 7, },
    },
    b:{
      resource: '00000010',
      stage1 : { cost: '03000000', boon: '133', },
      stage2 : { cost: '40000000', boon: '144', },
    },
  },
  {
    name: 'The Lighthouse of Alexandria',
    a:{
      resource: '00000100',
      stage1 : { cost: '00020000', boon: 3, },
      stage2 : { cost: '00300000', boon: 'anybasic', },
      stage3 : { cost: '40000000', boon: 7, },
    },
    b:{
      resource: '00000010',
      stage1 : { cost: '00200000', boon: 'anybasic', },
      stage2 : { cost: '00020000', boon: 'anyadv', },
      stage3 : { cost: '03000000', boon: 7, },
    },
  },
  {
    name: 'The Statue of Zeus in Olympia',
    a:{
      resource: '00010000',
      stage1 : { cost: '00020000', boon: 3, },
      stage2 : { cost: '02000000', boon: 'buildfree', },
      stage3 : { cost: '20000000', boon: 7, },
    },
    b:{
      resource: '00010000',
      stage1 : { cost: '00200000', boon: 'tradebasic', },
      stage2 : { cost: '00020000', boon: 5, },
      stage3 : { cost: '03000000', boon: 'copyguild' },
    },
  },
  {
    name: 'The Mausoleum of Halicarnassus',
    a:{
      resource: '00001000',
      stage1 : { cost: '00020000', boon: 3, },
      stage2 : { cost: '30000000', boon: 'graveyard', },
      stage3 : { cost: '00002000', boon: 7, },
    },
    b:{
      resource: '00001000',
      stage1 : { cost: '20000000', boon: [2, 'graveyard'], },
      stage2 : { cost: '00300000', boon: [1, 'graveyard'], },
      stage3 : { cost: '00001110', boon: 'graveyard' },
    },
  }, ];
  //when adding additional wonders with more than just basic resources, boon ought to be an array

  Wonders.remove({});
  _.each(wonders, function(wonder) {
    Wonders.insert(wonder);
  });
}

function defineCards() {
  //ore, stone, brick, wood, textile, glass, papyrus, coins
  //military, vp, coins
  //All cards that have chained descendents must be defined before their children. This car be achieved by making declarations in age order
  cards = [
    {
    name:"Lumber Yard",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: '00010000',
    cost: '00000000',
  },
    {
    name:"Lumber Yard",
    minPlayers: 4,
    age: 1,
    color: 'brown',
    resource: '00010000',
    cost: '00000000',
  },
    {
    name:"Stone Pit",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: '01000000',
    cost: '00000000',
  },
    {
    name:"Stone Pit",
    minPlayers: 5,
    age: 1,
    color: 'brown',
    resource: '01000000',
    cost: '00000000',
  },
    {
    name:"Clay Pool",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: '00100000',
    cost: '00000000',
  },
    {
    name:"Clay Pool",
    minPlayers: 5,
    age: 1,
    color: 'brown',
    resource: '00100000',
    cost: '00000000',
  },
    {
    name:"Ore Vein",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: '10000000',
    cost: '00000000',
  },
    {
    name:"Ore Vein",
    minPlayers: 4,
    age: 1,
    color: 'brown',
    resource: '10000000',
    cost: '00000000',
  },
    {
    name:"Tree Farm",
    minPlayers: 6,
    age: 1,
    color: 'brown',
    resource: ['00100000','00010000'],
    cost: '00000001',
  },
    {
    name:"Excavation",
    minPlayers: 4,
    age: 1,
    color: 'brown',
    resource: ['01000000','00010000'],
    cost: '00000001',
  },
    {
    name:"Clay Pit",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: ['00100000','10000000'],
    cost: '00000001',
  },
    {
    name:"Timber Yard",
    minPlayers: 3,
    age: 1,
    color: 'brown',
    resource: ['01000000','00010000'],
    cost: '00000001',
  },
    {
    name:"Forest Cave",
    minPlayers: 5,
    age: 1,
    color: 'brown',
    resource: ['10000000','00010000'],
    cost: '00000001',
  },
    {
    name:"Mine",
    minPlayers: 6,
    age: 1,
    color: 'brown',
    resource: ['10000000','01000000'],
    cost: '00000001',
  },
    {
    name:"Loom",
    minPlayers: 3,
    age: 1,
    color: 'grey',
    resource: '00001000',
    cost: '00000000',
  },
    {
    name:"Loom",
    minPlayers: 6,
    age: 1,
    color: 'grey',
    resource: '00001000',
    cost: '00000000',
  },
    {
    name:"Glassworks",
    minPlayers: 3,
    age: 1,
    color: 'grey',
    resource: '00000100',
    cost: '00000000',
  },
    {
    name:"Glassworks",
    minPlayers: 6,
    age: 1,
    color: 'grey',
    resource: '00000100',
    cost: '00000000',
  },
    {
    name:"Press",
    minPlayers: 3,
    age: 1,
    color: 'grey',
    resource: '00000010',
    cost: '00000000',
  },
    {
    name:"Press",
    minPlayers: 6,
    age: 1,
    color: 'grey',
    resource: '00000010',
    cost: '00000000',
  },
    {
    name:"Pawnshop",
    minPlayers: 4,
    age: 1,
    color: 'blue',
    boon: 3,
    cost: '00000000',
  },
    {
    name:"Pawnshop",
    minPlayers: 7,
    age: 1,
    color: 'blue',
    boon: 3,
    cost: '00000000',
  },
  {
    name:"Baths",
    minPlayers: 3,
    age: 1,
    color: 'blue',
    boon: 3,
    cost: '01000000',
    chainTo: 'Aqueduct',
  },
  {
    name:"Baths",
    minPlayers: 7,
    age: 1,
    color: 'blue',
    boon: 3,
    cost: '01000000',
    chainTo: 'Aqueduct',
  },
  {
    name:"Altar",
    minPlayers: 3,
    age: 1,
    color: 'blue',
    boon: 2,
    cost: '00000000',
    chainTo: 'Temple',
  },
  {
    name:"Altar",
    minPlayers: 5,
    age: 1,
    color: 'blue',
    boon: 2,
    cost: '00000000',
    chainTo: 'Temple',
  },
  {
    name:"Theater",
    minPlayers: 3,
    age: 1,
    color: 'blue',
    boon: 2,
    cost: '00000000',
    chainTo: 'Statue',
  },
  {
    name:"Theater",
    minPlayers: 6,
    age: 1,
    color: 'blue',
    boon: 2,
    cost: '00000000',
    chainTo: 'Statue',
  },
  {
    name:"Tavern",
    minPlayers: 4,
    age: 1,
    color: 'yellow',
    boon: '005',
    cost: '00000000',
  },
  {
    name:"Tavern",
    minPlayers: 5,
    age: 1,
    color: 'yellow',
    boon: '005',
    cost: '00000000',
  },
  {
    name:"Tavern",
    minPlayers: 7,
    age: 1,
    color: 'yellow',
    boon: '005',
    cost: '00000000',
  },
  {
    name:"East Trading Post",
    minPlayers: 3,
    age: 1,
    color: 'yellow',
    boon: 'tradebasicright',
    cost: '00000000',
    chainTo: 'Forum',
  },
  {
    name:"East Trading Post",
    minPlayers: 7,
    age: 1,
    color: 'yellow',
    boon: 'tradebasicright',
    cost: '00000000',
    chainTo: 'Forum',
  },
  {
    name:"West Trading Post",
    minPlayers: 3,
    age: 1,
    color: 'yellow',
    boon: 'tradebasicleft',
    cost: '00000000',
    chainTo: 'Forum',
  },
  {
    name:"West Trading Post",
    minPlayers: 7,
    age: 1,
    color: 'yellow',
    boon: 'tradebasicleft',
    cost: '00000000',
    chainTo: 'Forum',
  },
  {
    name:"MarketPlace",
    minPlayers: 3,
    age: 1,
    color: 'yellow',
    boon: 'tradeadv',
    cost: '00000000',
    chainTo: 'Caravansery',
  },
  {
    name:"MarketPlace",
    minPlayers: 6,
    age: 1,
    color: 'yellow',
    boon: 'tradeadv',
    cost: '00000000',
    chainTo: 'Caravansery',
  },
  {
    name:"Stockade",
    minPlayers: 3,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '00010000',
  },
  {
    name:"Stockade",
    minPlayers: 7,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '00010000',
  },
  {
    name:"Barracks",
    minPlayers: 3,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '10000000',
  },
  {
    name:"Barracks",
    minPlayers: 5,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '10000000',
  },
  {
    name:"Guard Tower",
    minPlayers: 3,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '00100000',
  },
  {
    name:"Guard Tower",
    minPlayers: 4,
    age: 1,
    color: 'red',
    boon: '100',
    cost: '00100000',
  },
  {
    name:"Apothecary",
    minPlayers: 3,
    age: 1,
    color: 'green',
    tech: 'compass',
    cost: '00001000',
    chainTo: ['Stables', 'Dispensary'],
  },
  {
    name:"Apothecary",
    minPlayers: 5,
    age: 1,
    color: 'green',
    tech: 'compass',
    cost: '00001000',
    chainTo: ['Stables', 'Dispensary'],
  },
  {
    name:"Workshop",
    minPlayers: 3,
    age: 1,
    color: 'green',
    tech: 'gear',
    cost: '00000100',
    chainTo: ['Archery Range', 'Laboratory'],
  },
  {
    name:"Workshop",
    minPlayers: 7,
    age: 1,
    color: 'green',
    tech: 'gear',
    cost: '00000100',
    chainTo: ['Archery Range', 'Laboratory'],
  },
  {
    name:"Scriptorium",
    minPlayers: 3,
    age: 1,
    color: 'green',
    tech: 'tablet',
    cost: '00000010',
    chainTo: ['Courthouse', 'Library'],
  },
  {
    name:"Scriptorium",
    minPlayers: 4,
    age: 1,
    color: 'green',
    tech: 'tablet',
    cost: '00000010',
    chainTo: ['Courthouse', 'Library'],
  },
  {
    name:"Sawmill",
    minPlayers: 3,
    age: 2,
    color: 'brown',
    resource: '00020000',
    cost: '00000001',
  },
  {
    name:"Sawmill",
    minPlayers: 4,
    age: 2,
    color: 'brown',
    resource: '00020000',
    cost: '00000001',
  },
  {
    name:"Quarry",
    minPlayers: 3,
    age: 2,
    color: 'brown',
    resource: '02000000',
    cost: '00000001',
  },
  {
    name:"Quarry",
    minPlayers: 4,
    age: 2,
    color: 'brown',
    resource: '02000000',
    cost: '00000001',
  },
  {
    name:"Brickyard",
    minPlayers: 3,
    age: 2,
    color: 'brown',
    resource: '00200000',
    cost: '00000001',
  },
  {
    name:"Brickyard",
    minPlayers: 4,
    age: 2,
    color: 'brown',
    resource: '00200000',
    cost: '00000001',
  },
  {
    name:"Foundry",
    minPlayers: 3,
    age: 2,
    color: 'brown',
    resource: '20000000',
    cost: '00000001',
  },
  {
    name:"Foundry",
    minPlayers: 4,
    age: 2,
    color: 'brown',
    resource: '20000000',
    cost: '00000001',
  },
    {
    name:"Loom",
    minPlayers: 3,
    age: 2,
    color: 'grey',
    resource: '00001000',
    cost: '00000000',
  },
    {
    name:"Loom",
    minPlayers: 5,
    age: 2,
    color: 'grey',
    resource: '00001000',
    cost: '00000000',
  },
    {
    name:"Glassworks",
    minPlayers: 3,
    age: 2,
    color: 'grey',
    resource: '00000100',
    cost: '00000000',
  },
    {
    name:"Glassworks",
    minPlayers: 5,
    age: 2,
    color: 'grey',
    resource: '00000100',
    cost: '00000000',
  },
    {
    name:"Press",
    minPlayers: 3,
    age: 2,
    color: 'grey',
    resource: '00000010',
    cost: '00000000',
  },
    {
    name:"Press",
    minPlayers: 5,
    age: 2,
    color: 'grey',
    resource: '00000010',
    cost: '00000000',
  },
    {
    name:"Aqueduct",
    minPlayers: 3,
    age: 2,
    color: 'blue',
    boon: 5,
    cost: '03000000',
    chainFrom: 'Baths',
  },
    {
    name:"Aqueduct",
    minPlayers: 7,
    age: 2,
    color: 'blue',
    boon: 5,
    cost: '03000000',
    chainFrom: 'Baths',
  },
    {
    name:"Temple",
    minPlayers: 3,
    age: 2,
    color: 'blue',
    boon: 3,
    cost: '00110100',
    chainTo: 'Pantheon',
    chainFrom: 'Altar',
  },
    {
    name:"Temple",
    minPlayers: 6,
    age: 2,
    color: 'blue',
    boon: 4,
    cost: '00110100',
    chainTo: 'Pantheon',
    chainFrom: 'Altar',
  },
    {
    name:"Statue",
    minPlayers: 3,
    age: 2,
    color: 'blue',
    boon: 4,
    cost: '20010000',
    chainTo: 'Gardens',
    chainFrom: 'Theater',
  },
    {
    name:"Statue",
    minPlayers: 7,
    age: 2,
    color: 'blue',
    boon: 4,
    cost: '20010000',
    chainTo: 'Gardens',
    chainFrom: 'Theater',
  },
    {
    name:"Courthouse",
    minPlayers: 3,
    age: 2,
    color: 'blue',
    boon: 4,
    cost: '00201000',
    chainFrom: 'Scriptorium',
  },
    {
    name:"Courthouse",
    minPlayers: 5,
    age: 2,
    color: 'blue',
    boon: 4,
    cost: '00201000',
    chainFrom: 'Scriptorium',
  },
    {
    name:"Forum",
    minPlayers: 3,
    age: 2,
    color: 'yellow',
    boon: 'anyadv',
    cost: '00200000',
    chainTo: 'Haven',
    chainFrom: ['East Trading Post', 'West Trading Post'],
  },
    {
    name:"Forum",
    minPlayers: 6,
    age: 2,
    color: 'yellow',
    boon: 'anyadv',
    cost: '00200000',
    chainTo: 'Haven',
    chainFrom: ['East Trading Post', 'West Trading Post'],
  },
    {
    name:"Forum",
    minPlayers: 7,
    age: 2,
    color: 'yellow',
    boon: 'anyadv',
    cost: '00200000',
    chainTo: 'Haven',
    chainFrom: ['East Trading Post', 'West Trading Post'],
  },
    {
    name:"Caravansery",
    minPlayers: 3,
    age: 2,
    color: 'yellow',
    boon: 'anybasic',
    cost: '00020000',
    chainTo: 'Haven',
    chainFrom: 'MarketPlace',
  },
    {
    name:"Caravansery",
    minPlayers: 5,
    age: 2,
    color: 'yellow',
    boon: 'anybasic',
    cost: '00020000',
    chainTo: 'Lighthouse',
    chainFrom: 'MarketPlace',
  },
    {
    name:"Caravansery",
    minPlayers: 6,
    age: 2,
    color: 'yellow',
    boon: 'anybasic',
    cost: '00020000',
    chainTo: 'Lighthouse',
    chainFrom: 'MarketPlace',
  },
    {
    name:"Vineyard",
    minPlayers: 3,
    age: 2,
    color: 'yellow',
    boon: '00x',
    cost: '00000000',
    x: ['lsr', 'brown', 1],
  },
    {
    name:"Vineyard",
    minPlayers: 6,
    age: 2,
    color: 'yellow',
    boon: '00x',
    cost: '00000000',
    x: ['lsr', 'brown', 1],
  },
    {
    name:"Bazar",
    minPlayers: 4,
    age: 2,
    color: 'yellow',
    boon: '00x',
    cost: '00000000',
    x: ['lsr', 'grey', 2],
  },
    {
    name:"Bazar",
    minPlayers: 7,
    age: 2,
    color: 'yellow',
    boon: '00x',
    cost: '00000000',
    x: ['lsr', 'grey', 2],
  },
    {
    name:"Walls",
    minPlayers: 3,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '03000000',
    chainTo: 'Fortifications',
  },
    {
    name:"Walls",
    minPlayers: 7,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '03000000',
    chainTo: 'Fortifications',
  },
    {
    name:"Training Ground",
    minPlayers: 4,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '20010000',
    chainTo: 'Circus',
  },
    {
    name:"Training Ground",
    minPlayers: 6,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '20010000',
    chainTo: 'Circus',
  },
    {
    name:"Training Ground",
    minPlayers: 7,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '20010000',
    chainTo: 'Circus',
  },
    {
    name:"Stables",
    minPlayers: 3,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '10110000',
    chainFrom: 'Apothecary',
  },
    {
    name:"Stables",
    minPlayers: 5,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '10110000',
    chainFrom: 'Apothecary',
  },
    {
    name:"Archery Range",
    minPlayers: 3,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '10020000',
    chainFrom: 'Workshop',
  },
    {
    name:"Archery Range",
    minPlayers: 6,
    age: 2,
    color: 'red',
    boon: '200',
    cost: '10020000',
    chainFrom: 'Workshop',
  },
    {
    name:"Dispensary",
    minPlayers: 3,
    age: 2,
    color: 'green',
    tech: 'compass',
    cost: '20000010',
    chainFrom: 'Apothecary',
    chainTo: ['Arena', 'Lodge', ],
  },
    {
    name:"Dispensary",
    minPlayers: 4,
    age: 2,
    color: 'green',
    tech: 'compass',
    cost: '20000100',
    chainFrom: 'Apothecary',
    chainTo: ['Arena', 'Lodge', ],
  },
    {
    name:"Laboratory",
    minPlayers: 3,
    age: 2,
    color: 'green',
    tech: 'gear',
    cost: '00200010',
    chainFrom: 'Workshop',
    chainTo: ['Siege Workshop', 'Observatory', ],
  },
    {
    name:"Laboratory",
    minPlayers: 5,
    age: 2,
    color: 'green',
    tech: 'gear',
    cost: '00200010',
    chainFrom: 'Workshop',
    chainTo: ['Siege Workshop', 'Observatory', ],
  },
    {
    name:"Library",
    minPlayers: 3,
    age: 2,
    color: 'green',
    tech: 'tablet',
    cost: '02001000',
    chainFrom: 'Scriptorium',
    chainTo: ['Senate', 'University', ],
  },
    {
    name:"Library",
    minPlayers: 6,
    age: 2,
    color: 'green',
    tech: 'tablet',
    cost: '02001000',
    chainFrom: 'Scriptorium',
    chainTo: ['Senate', 'University', ],
  },
    {
    name:"School",
    minPlayers: 3,
    age: 2,
    color: 'green',
    tech: 'tablet',
    cost: '00010010',
    chainTo: ['Academy', 'Study', ],
  },
    {
    name:"School",
    minPlayers: 7,
    age: 2,
    color: 'green',
    tech: 'tablet',
    cost: '00010010',
    chainTo: ['Academy', 'Study', ],
  },
    {
    name:"Pantheon",
    minPlayers: 3,
    age: 3,
    color: 'blue',
    boon: 7,
    cost: '10201110',
    chainFrom: 'Temple',
  },
    {
    name:"Pantheon",
    minPlayers: 6,
    age: 3,
    color: 'blue',
    boon: 7,
    cost: '10201110',
    chainFrom: 'Temple',
  },
    {
    name:"Gardens",
    minPlayers: 3,
    age: 3,
    color: 'blue',
    boon: 5,
    cost: '00210000',
    chainFrom: 'Statue',
  },
    {
    name:"Gardens",
    minPlayers: 4,
    age: 3,
    color: 'blue',
    boon: 5,
    cost: '00210000',
    chainFrom: 'Statue',
  },
    {
    name:"Town Hall",
    minPlayers: 3,
    age: 3,
    color: 'blue',
    boon: 6,
    cost: '12000100',
  },
    {
    name:"Town Hall",
    minPlayers: 5,
    age: 3,
    color: 'blue',
    boon: 6,
    cost: '12000100',
  },
    {
    name:"Town Hall",
    minPlayers: 6,
    age: 3,
    color: 'blue',
    boon: 6,
    cost: '12000100',
  },
    {
    name:"Palace",
    minPlayers: 3,
    age: 3,
    color: 'blue',
    boon: 8,
    cost: '11111110',
  },
    {
    name:"Palace",
    minPlayers: 7,
    age: 3,
    color: 'blue',
    boon: 8,
    cost: '11111110',
  },
    {
    name:"Senate",
    minPlayers: 3,
    age: 3,
    color: 'blue',
    boon: 6,
    cost: '11020000',
    chainFrom: "Library",
  },
    {
    name:"Senate",
    minPlayers: 5,
    age: 3,
    color: 'blue',
    boon: 6,
    cost: '11020000',
    chainFrom: "Library",
  },
    {
    name:"Haven",
    minPlayers: 3,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '10011000',
    chainFrom: "Forum",
    x: ['s', 'brown', 1],
  },
    {
    name:"Haven",
    minPlayers: 4,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '10011000',
    chainFrom: "Forum",
    x: ['s', 'brown', 2],
  },
    {
    name:"Lighthouse",
    minPlayers: 3,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '01000100',
    chainFrom: "Caravansery",
    x: ['s', 'yellow', 1],
  },
    {
    name:"Lighthouse",
    minPlayers: 6,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '01000100',
    chainFrom: "Caravansery",
    x: ['s', 'yellow', 1],
  },
    {
    name:"Chamber of Commerce",
    minPlayers: 4,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '00200010',
    x: ['s', 'grey', 2],
  },
    {
    name:"Chamber of Commerce",
    minPlayers: 6,
    age: 3,
    color: 'yellow',
    boon: '0xx',
    cost: '00200010',
    x: ['s', 'grey', 2],
  },
    {
    name:"Arena",
    minPlayers: 3,
    age: 3,
    color: 'yellow',
    boon: '0xy',
    cost: '12000000',
    x: ['s', 'stages', 1],
    y: ['s', 'stages', 3],
    chainFrom: "Dispensary",
  },
    {
    name:"Arena",
    minPlayers: 5,
    age: 3,
    color: 'yellow',
    boon: '0xy',
    cost: '12000000',
    x: ['s', 'stages', 1],
    y: ['s', 'stages', 3],
    chainFrom: "Dispensary",
  },
    {
    name:"Arena",
    minPlayers: 7,
    age: 3,
    color: 'yellow',
    boon: '0xy',
    cost: '12000000',
    x: ['s', 'stages', 1],
    y: ['s', 'stages', 3],
    chainFrom: "Dispensary",
  },
    {
    name:"Fortifications",
    minPlayers: 3,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '31000000',
    chainFrom: "Walls",
  },
    {
    name:"Fortifications",
    minPlayers: 7,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '31000000',
    chainFrom: "Walls",
  },
    {
    name:"Circus",
    minPlayers: 4,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '13000000',
    chainFrom: "Training Ground",
  },
    {
    name:"Circus",
    minPlayers: 5,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '13000000',
    chainFrom: "Training Ground",
  },
    {
    name:"Circus",
    minPlayers: 6,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '13000000',
    chainFrom: "Training Ground",
  },
    {
    name:"Arsenal",
    minPlayers: 3,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '10021000',
  },
    {
    name:"Arsenal",
    minPlayers: 4,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '10021000',
  },
    {
    name:"Arsenal",
    minPlayers: 7,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '10021000',
  },
    {
    name:"Siege Workshop",
    minPlayers: 3,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '00310000',
    chainFrom: "Laboratory",
  },
    {
    name:"Siege Workshop",
    minPlayers: 5,
    age: 3,
    color: 'red',
    boon: '300',
    cost: '00310000',
    chainFrom: "Laboratory",
  },
    {
    name:"Lodge",
    minPlayers: 3,
    age: 3,
    color: 'green',
    tech: 'compass',
    cost: '00201010',
    chainFrom: "Dispensary",
  },
    {
    name:"Lodge",
    minPlayers: 6,
    age: 3,
    color: 'green',
    tech: 'compass',
    cost: '00201010',
    chainFrom: "Dispensary",
  },
    {
    name:"Observatory",
    minPlayers: 3,
    age: 3,
    color: 'green',
    tech: 'gear',
    cost: '20001100',
    chainFrom: "Laboratory",
  },
    {
    name:"Observatory",
    minPlayers: 7,
    age: 3,
    color: 'green',
    tech: 'gear',
    cost: '20001100',
    chainFrom: "Laboratory",
  },
    {
    name:"University",
    minPlayers: 3,
    age: 3,
    color: 'green',
    tech: 'tablet',
    cost: '00020110',
    chainFrom: "Library",
  },
    {
    name:"University",
    minPlayers: 4,
    age: 3,
    color: 'green',
    tech: 'tablet',
    cost: '00020110',
    chainFrom: "Library",
  },
    {
    name:"Academy",
    minPlayers: 3,
    age: 3,
    color: 'green',
    tech: 'compass',
    cost: '03000100',
    chainFrom: "School",
  },
    {
    name:"Academy",
    minPlayers: 7,
    age: 3,
    color: 'green',
    tech: 'compass',
    cost: '03000100',
    chainFrom: "School",
  },
    {
    name:"Study",
    minPlayers: 3,
    age: 3,
    color: 'green',
    tech: 'gear',
    cost: '00011010',
    chainFrom: "School",
  },
    {
    name:"Study",
    minPlayers: 5,
    age: 3,
    color: 'green',
    tech: 'gear',
    cost: '00011010',
    chainFrom: "School",
  },
    {
    name:"Workers Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '21110000',
    boon: '0x0',
    x: ['lr', 'brown', 1],
  },
    {
    name:"Craftmens Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '22000000',
    boon: '0x0',
    x: ['lr', 'grey', 1],
  },
    {
    name:"Traders Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '00001110',
    boon: '0x0',
    x: ['lr', 'yellow', 1],
  },
    {
    name:"Philosophers Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '00301010',
    boon: '0x0',
    x: ['lr', 'green', 1],
  },
    {
    name:"Spy Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '00300100',
    boon: '0x0',
    x: ['lr', 'red', 1],
  },
    {
    name:"Strategists Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '21001000',
    boon: '0x0',
    x: ['lr', 'losses', 1],
  },
    {
    name:"Shipowners Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '00001110',
    boon: '0x0',
    x: ['s', ['brown', 'grey', 'purple'], 1, 'each'],
  },
    {
    name:"Scientists Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '20020010',
    boon: 'anytech',
  },
    {
    name:"Magistrates Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '01031000',
    boon: '0x0',
    x: ['lr', 'blue', 1],
  },
    {
    name:"Builders Guild",
    minPlayers: 0,
    age: 3,
    color: 'purple',
    cost: '02200100',
    boon: '0x0',
    x: ['lsr', 'stage', 1],
  },
  ];

  Cards.remove({});
  _.each(cards, function(card) {
    var acceptableName = card.name.replace(/\s+/g, '');
    //build chainFrom indexes, using regex to make variables viable
    if (card.chainFrom) {
      if (typeof card.chainFrom == "string") {
        var acceptableChainFrom =  card.chainFrom.replace(/\s+/g, '');
        card.chainFromId = eval(acceptableChainFrom);
      } else  {
        card.chainFromId = [];
        _.each(card.chainFrom, function(idArray) {
          var acceptableChainFrom =  idArray.replace(/\s+/g, '');
          card.chainFromId = card.chainFromId.concat(eval(acceptableChainFrom));
        })
      }
    }

    // define so as to return the collection Id as a variable set to the card name for use
    if (typeof eval('this.' + acceptableName) === "undefined") {
      eval( acceptableName + " = []");
    }

      //console.log(eval('acceptableName'));
    eval(acceptableName + '.push(Cards.insert(card))');
  });
}

