
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
