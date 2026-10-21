// Explicit data ported from the existing Godot CharacterRegistry and World1_1 scene.
export const VIEW = Object.freeze({ width: 480, height: 270, worldWidth: 2280 });
export const CHARACTERS = Object.freeze([
  { id:'bobo', name:'波波', age_group:'adult', body_type:'standard', ability_id:'bobo_trick_dash', unlocked:true, description:'聰明又調皮的橘虎斑冒險家' },
  { id:'doufu', name:'豆福', age_group:'kitten', body_type:'kitten', ability_id:null, unlocked:false, description:'溫柔愛玩的麒麟尾小貓' },
  { id:'buka', name:'布卡', age_group:'adult', body_type:'round', ability_id:null, unlocked:false, description:'傲嬌的黑白貓公主' },
  { id:'hongzao', name:'紅棗', age_group:'kitten', body_type:'kitten', ability_id:null, unlocked:false, description:'貼心又怕寂寞的小虎斑' },
  { id:'coco', name:'可可', age_group:'kitten', body_type:'kitten', ability_id:null, unlocked:false, description:'活潑好奇的黑色幼貓' },
  { id:'xiaokui', name:'小葵', age_group:'kitten', body_type:'slim', ability_id:null, unlocked:false, description:'銀灰虎斑、短尾的優雅幼貓' },
  { id:'bimo', name:'畢莫', age_group:'adult', body_type:'standard', ability_id:null, unlocked:false, description:'害羞細膩的黑色成年貓' }
]);
export const LEVELS = Object.freeze([{id:'world_1_1',name:'東京・貓町',region:'Tokyo',unlocked:true}]);
export const FUTURE_REGIONS = Object.freeze(['大阪','九州','北海道']);
export const ITEMS = Object.freeze({healing_snack:{id:'healing_snack',name:'Healing Snack',price:5,heal_amount:1,stack_limit:99}});
export const QUEST = Object.freeze({id:'tutorial_coins',title:'收集三枚金幣',target_amount:3,reward_coins:2});
export const WORLD = Object.freeze({
  start:{x:70,y:210}, goal:{x:1500,y:200}, checkpoint:{id:'Checkpoint',x:820,y:215},
  solids:[
    {x:0,y:230,w:900,h:40}, {x:1100,y:230,w:1180,h:40},
    {x:335,y:202,w:110,h:28}, {x:570,y:158,w:120,h:72},
    {x:1048,y:70,w:24,h:170}
  ],
  oneWays:[{x:850,y:149,w:100,h:12}],
  coins:[{id:'Coin1',x:260,y:205},{id:'Coin2',x:390,y:180},{id:'Coin3',x:630,y:140},{id:'Coin4',x:900,y:125},{id:'Coin5',x:1280,y:205}],
  npc:{id:'TutorialNPC',x:175,y:220}, merchant:{id:'MerchantNPC',x:735,y:220},
  enemy:{id:'Enemy',x:485,y:210}, hazard:{x:1152,y:218,w:36,h:12},
  deathPit:{x:900,y:270,w:200,h:400}, hiddenRoute:{x:850,y:149,w:100,h:12}
});
