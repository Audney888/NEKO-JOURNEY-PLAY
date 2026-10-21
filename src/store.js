import {CHARACTERS,LEVELS,ITEMS,QUEST} from './data.js';
export const SAVE_KEY='neko_journey_native_v1';
export const SETTINGS_KEY='neko_journey_native_settings_v1';
export const DEFAULT_SETTINGS=Object.freeze({master:.8,music:.7,sfx:.8,touch_opacity:.65});
export const defaultState=()=>({selected_character:'bobo',current_level:'world_1_1',coins:0,inventory:{},unlocked_characters:['bobo'],unlocked_levels:['world_1_1'],current_checkpoint:{},collected_coins:[],tutorial_completed:[],quests:{}});
const obj=v=>v!==null && typeof v==='object' && !Array.isArray(v);
const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000;
export function validSettings(s){return obj(s)&&Object.keys(DEFAULT_SETTINGS).every(k=>typeof s[k]==='number' && Number.isFinite(s[k]) && s[k] >= (k==='touch_opacity'?.2:0)&&s[k]<=1);}
export function validState(s){
 if(!obj(s)|| !CHARACTERS.some(c=>c.id===s.selected_character&&c.unlocked) || !LEVELS.some(l=>l.id===s.current_level) || !count(s.coins))return false;
 if(!obj(s.inventory)||!obj(s.quests)||!obj(s.current_checkpoint))return false;
 for(const k of ['unlocked_characters','unlocked_levels','collected_coins','tutorial_completed'])if(!Array.isArray(s[k])||!s[k].every(x=>typeof x==='string'))return false;
 if(!s.unlocked_characters.includes(s.selected_character)||!s.unlocked_levels.includes(s.current_level))return false;
 for(const [k,v] of Object.entries(s.inventory))if(!ITEMS[k]||!count(v)||v>ITEMS[k].stack_limit)return false;
 if(Object.keys(s.quests).some(k=>k!==QUEST.id))return false;
 for(const q of Object.values(s.quests))if(!obj(q)||!['active','inactive','completed'].includes(q.state)||!count(q.progress)||q.progress>QUEST.target_amount)return false;
 if(Object.keys(s.current_checkpoint).length&&s.current_checkpoint.id!=='Checkpoint')return false;
 return true;
}
export function validateEnvelope(p){return obj(p)&&p.save_version===1&&validState(p.state)&&validSettings(p.settings);}
export class SaveStore{
 constructor(storage=globalThis.localStorage){this.storage=storage;this.settings=this.readSettings();this.state=null;}
 safeGet(k){try{return this.storage?.getItem(k)}catch{return null}}
 safeSet(k,v){try{this.storage?.setItem(k,JSON.stringify(v));return true}catch{return false}}
 readSettings(){try{const data=JSON.parse(this.safeGet(SETTINGS_KEY));return validSettings(data)?data:{...DEFAULT_SETTINGS}}catch{return {...DEFAULT_SETTINGS}}}
 read(){try{const p=JSON.parse(this.safeGet(SAVE_KEY));return validateEnvelope(p)?p:null}catch{return null}}
 hasSave(){return !!this.read()}
 newGame(){this.state=defaultState();this.save();return this.state}
 load(){const p=this.read();if(!p)return false;this.state=structuredClone(p.state);this.settings=this.readSettings();return true}
 save(){return !!this.state&&this.safeSet(SAVE_KEY,{save_version:1,state:this.state,settings:this.settings})}
 updateSettings(k,v){if(!(k in DEFAULT_SETTINGS)||!Number.isFinite(v))return false;this.settings[k]=Math.max(k==='touch_opacity'?.2:0,Math.min(1,v));const ok=this.safeSet(SETTINGS_KEY,this.settings);if(this.state)this.save();return ok}
 changeCoins(n){if(!this.state)return false;this.state.coins=Math.max(0,this.state.coins+n);this.save();return true}
 addItem(id,n=1){if(!this.state||!ITEMS[id]||!count(n))return false;const next=(this.state.inventory[id]||0)+n;if(next>ITEMS[id].stack_limit)return false;this.state.inventory[id]=next;this.save();return true}
 purchase(id){const item=ITEMS[id];if(!this.state||!item||this.state.coins<item.price||!this.addItem(id,1))return false;this.changeCoins(-item.price);return true}
 useItem(id, hp,maxHp){if(!this.state||!ITEMS[id]||(this.state.inventory[id]||0)<1||hp>=maxHp||hp<=0)return null;this.state.inventory[id]--;this.save();return Math.min(maxHp,hp+ITEMS[id].heal_amount)}
 collectCoin(id){if(!this.state||this.state.collected_coins.includes(id))return false;this.state.collected_coins.push(id);this.state.coins+=1;const q=this.state.quests[QUEST.id];if(q?.state==='active'){q.progress=Math.min(QUEST.target_amount,q.progress+1);if(q.progress===QUEST.target_amount){q.state='completed';this.state.coins+=QUEST.reward_coins;}}this.save();return true}
 startQuest(){if(!this.state)return false;const q=this.state.quests[QUEST.id];if(q)return false;this.state.quests[QUEST.id]={state:'active',progress:0};this.save();return true}
 setCheckpoint(id){if(!this.state)return;this.state.current_checkpoint={id};this.save()}
}
