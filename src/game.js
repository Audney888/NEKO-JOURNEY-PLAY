import {VIEW,WORLD,ITEMS,QUEST,CHARACTERS,FUTURE_REGIONS} from './data.js';
import {Input} from './input.js';
import {SaveStore,DEFAULT_SETTINGS} from './store.js';
import {drawTokyoBackground,drawTokyoProps,drawGround,drawCatPlaceholder,drawFriendlyCat,drawKuro} from './art.js';

const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const overlap=(a,b)=>a.x < b.x+b.w&&a.x+a.w>b.x&&a.y < b.y+b.h&&a.y+a.h>b.y;
const rect=(x,y,w,h)=>({x,y,w,h});

export class NekoGame{
 constructor({canvas,menu,menuInner,hud,touch,rotate,toast}){
  Object.assign(this,{canvas,menu,menuInner,hud,touch,rotate,toast});
  this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
  this.store=new SaveStore();this.input=new Input();this.input.bindKeyboard();this.input.bindTouch(touch);
  this.scene='title';this.overlay=null;this.camera=0;this.player=null;this.enemy=null;this.kuro={x:35,y:160};
  this.last=0;this.acc=0;this.clock=0;this.ticks=0;this.toastTimeout=0;this.interactObject=null;
  this.pauses=new Set();this.fatal=null;
  document.querySelector('#pause-fab').addEventListener('click',()=>this.pause());
  window.addEventListener('blur',()=>this.onFocusLost());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.onFocusLost()});
  window.addEventListener('resize',()=>this.checkOrientation());
  window.addEventListener('orientationchange',()=>this.checkOrientation());
  window.visualViewport?.addEventListener('resize',()=>this.checkOrientation());
  document.addEventListener('contextmenu',e=>{if(e.target.closest('#stage'))e.preventDefault()});
  this.showTitle();this.checkOrientation();
 }
 run(){this.last=performance.now();requestAnimationFrame(t=>this.loop(t))}
 loop(ts){requestAnimationFrame(t=>this.loop(t));try{
  const dt=Math.min((ts-this.last)/1000,.1);this.last=ts;this.acc=Math.min(.2,this.acc+dt);
  while(this.acc>=1/60){this.step(1/60);this.acc-=1/60}
  this.draw();
  this.ticks++;
  if(this.ticks%8===0)this.updateHud();
 }catch(e){if(!this.fatal){this.fatal=e;console.error('NEKO runtime error:',e);this.flash('遊戲發生錯誤，請重新整理')}}}
 step(dt){this.clock+=dt;this.input.step(dt);
  if(this.scene!=='game')return;
  if(this.input.tap('pause')){if(this.overlay==='pause')this.closeOverlay();else if(!this.overlay)this.pause()}
  if(this.overlay||this.pauses.size||!this.player)return;
  if(this.input.tap('talk'))this.interact();
  if(this.input.tap('item'))this.useItem();
  if(this.input.tap('attack'))this.attack();
  if(this.input.tap('skill'))this.skill();
  this.updatePlayer(dt);this.updateEnemy(dt);this.updateKuro(dt);
  if(this.player.hp<=0||this.player.y>VIEW.height+100)this.respawn();
  if(Math.abs(this.player.x-WORLD.goal.x)<18&&this.player.y>130)this.complete();
 }
 startFresh(){this.store.newGame();this.showCharacterSelect()}
 continueSaved(){if(!this.store.load()){this.flash('找不到有效存檔');this.showTitle();return}this.enterLevel(true)}
 enterLevel(fromSave=false){
  if(!this.store.state)this.store.newGame();
  const cp=this.store.state.current_checkpoint;
  this.player={x:cp.id==='Checkpoint'?WORLD.checkpoint.x:WORLD.start.x,y:cp.id==='Checkpoint'?WORLD.checkpoint.y-20:WORLD.start.y,w:18,h:20,vx:0,vy:0,hp:3,maxHp:3,grounded:false,airDash:1,dash:0,dashReady:true,dashCooldown:0,face:1,attackTime:0,invuln:0};
  this.enemy={...WORLD.enemy,x:WORLD.enemy.x-10,y:WORLD.enemy.y,w:20,h:20,alive:true,originX:WORLD.enemy.x-10,direction:-1,hitCooldown:0};
  this.camera=clamp(this.player.x-120,0,VIEW.worldWidth-VIEW.width);
  this.kuro={x:this.player.x-35,y:this.player.y-55};
  this.scene='game';this.overlay=null;this.pauses.clear();this.input.flush();this.menu.hidden=true;
  this.hud.hidden=false;this.touch.hidden=!this.isTouch();this.checkOrientation();
  this.updateHud();
  this.hint(fromSave?'已載入上次進度':'A / D 移動、Space 跳躍；按 E 和 NPC 對話');
 }
 isTouch(){return ('ontouchstart' in window)||navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches}
 checkOrientation(){const portrait=this.isTouch()&&innerHeight>innerWidth;this.rotate.hidden=!portrait;
   if(portrait&&this.scene==='game'){this.pauses.add('orientation');this.input.flush()}
   else this.pauses.delete('orientation');
   this.touch.hidden=this.scene!=='game'||!this.isTouch()||!!this.overlay||portrait;
 }
 onFocusLost(){this.input.flush();if(this.scene==='game'&&!this.overlay){this.pauses.add('focus');this.showPause(true)}}
 showScreen(html){this.scene='menu';this.menu.hidden=false;this.menuInner.innerHTML=html;this.hud.hidden=true;this.touch.hidden=true;this.input.flush();this.overlay=null;this.pauses.clear()}
 button(label,action,cls=''){return `<button type="button" class="btn ${cls}" data-menu-action="${action}">${label}</button>`}
 bindActions(map){for(const btn of this.menuInner.querySelectorAll('[data-menu-action]'))btn.addEventListener('click',()=>{map[btn.dataset.menuAction]?.()})}
 showTitle(){this.showScreen(`<div class="eyebrow">WEB NATIVE · DEVELOPMENT ALPHA</div><h1>NEKO JOURNEY</h1><p>喵歷險記 · 貓咪們的日本大冒險</p><div class="menu-actions">${this.button('開始遊戲','new','main')}${this.button('繼續遊戲','continue')}${this.button('設定','settings','ghost')}</div><p class="small">美術暫用中性 placeholder · 原 Godot 專案保留</p>`);
 const cont=this.menuInner.querySelector('[data-menu-action="continue"]');cont.disabled=!this.store.hasSave();
 this.bindActions({new:()=>this.startFresh(),continue:()=>this.continueSaved(),settings:()=>this.settings(()=>this.showTitle())});
 }
 showCharacterSelect(){this.showScreen(`<div class="eyebrow">01 · CHARACTER SELECT</div><h2>選擇夥伴</h2><div class="catgrid">${CHARACTERS.map(c=>`<button type="button" class="option" data-character="${c.id}" ${c.unlocked?'':'disabled'}>${c.name}<span>${c.unlocked?'可選擇':'未完成'}</span></button>`).join('')}</div><p class="small">波波：聰明、調皮的成年橘虎斑；Trick Dash 衝刺</p><div class="menu-actions">${this.button('返回主畫面','back','ghost')}</div>`);
 this.menuInner.querySelector('[data-character="bobo"]').addEventListener('click',()=>{this.store.state.selected_character='bobo';this.store.save();this.showLevelSelect()});this.bindActions({back:()=>this.showTitle()});}
 showLevelSelect(){this.showScreen(`<div class="eyebrow">02 · LEVEL SELECT</div><h2>日本冒險地圖</h2><div class="menu-actions">${this.button('WORLD 1-1 · 東京・貓町','level','main')}</div><p class="small">${FUTURE_REGIONS.join(' ／ ')}：規劃中</p>${this.button('返回角色選擇','back','ghost')}`);
 this.bindActions({level:()=>this.enterLevel(),back:()=>this.showCharacterSelect()})}
 pause(){if(this.scene!=='game'||this.overlay)return;this.pauses.add('manual');this.showPause(false)}
 showPause(focus=false){this.overlay='pause';this.input.flush();this.touch.hidden=true;this.menu.hidden=false;
 this.menuInner.innerHTML=`<div class="eyebrow">PAUSED</div><h2>暫停遊戲</h2><p>${focus?'離開分頁後已安全暫停':''}</p><div class="menu-actions">${this.button('繼續冒險','resume','main')}${this.button('重新開始關卡','restart')}${this.button('設定','settings')}${this.button('返回關卡選單','levels','ghost')}${this.button('返回主畫面','title','ghost')}</div>`;
 this.bindActions({resume:()=>this.closeOverlay(),restart:()=>{this.store.state.current_checkpoint={};this.store.save();this.enterLevel()},settings:()=>this.settings(()=>this.showPause()),levels:()=>this.showLevelSelect(),title:()=>this.showTitle()});}
 closeOverlay(){this.overlay=null;this.menu.hidden=true;this.pauses.clear();this.input.flush();this.checkOrientation()}
 settings(back){const previousScene=this.scene;this.overlay='settings';this.menu.hidden=false;this.touch.hidden=true;const s=this.store.settings;
 this.menuInner.innerHTML=`<div class="eyebrow">SETTINGS</div><h2>設定</h2>${[['master','主音量'],['music','音樂'],['sfx','音效'],['touch_opacity','觸控透明度']].map(([k,label])=>`<div class="setting"><label for="setting-${k}">${label}</label><input id="setting-${k}" data-setting="${k}" type="range" min="${k==='touch_opacity'?.2:0}" max="1" step="0.05" value="${s[k]}"></div>`).join('')}<p class="small">音訊播放架構預留；目前沒有正式音樂素材。</p>${this.button('返回','back','main')}`;
 for(const el of this.menuInner.querySelectorAll('[data-setting]'))el.addEventListener('input',()=>{this.store.updateSettings(el.dataset.setting,Number(el.value));this.touch.style.opacity=this.store.settings.touch_opacity});
 this.bindActions({back:()=>{if(previousScene==='game'){this.scene='game';back()}else back()}});
 }
 modal(type,title,body,buttons){this.overlay=type;this.input.flush();this.touch.hidden=true;this.menu.hidden=false;this.menuInner.innerHTML=`<div class="eyebrow">${type.toUpperCase()}</div><h2>${title}</h2><p>${body}</p><div class="menu-actions">${buttons.map(([label,id,cls])=>this.button(label,id,cls||'')).join('')}</div>`;this.bindActions(Object.fromEntries(buttons.map(([,id,,cb])=>[id,cb])))}
 interact(){const p=this.player;let near=[];if(Math.abs(p.x-WORLD.npc.x)<55)near.push(['npc',Math.abs(p.x-WORLD.npc.x)]);if(Math.abs(p.x-WORLD.merchant.x)<55)near.push(['merchant',Math.abs(p.x-WORLD.merchant.x)]);if(!near.length){this.hint('附近沒有可以互動的對象');return}near.sort((a,b)=>a[1]-b[1]);if(near[0][0]==='npc'){this.showDialogue()}else this.showShop()}
 showDialogue(){const first=this.store.startQuest();const lines=['歡迎來到東京・貓町！',first?'幫忙收集三枚金幣吧！完成後會得到 2 枚獎勵金幣。':'如果需要幫忙，試著使用跳躍和衝刺！'];let idx=0;
 const render=()=>this.modal('dialogue','教學貓',lines[idx],[[idx===lines.length-1?'結束對話':'下一頁','next','main',()=>{if(++idx>=lines.length)this.closeOverlay();else render()}]]);render();}
 showShop(){const item=ITEMS.healing_snack;const render=()=>this.modal('shop','喵喵上菜囉！',`歡迎光臨！<br>${item.name}：${item.price} 金幣／恢復 ${item.heal_amount} HP<br>目前金幣：${this.store.state.coins}，持有：${this.store.state.inventory[item.id]||0}`,[[`購買 ${item.name}`,'buy','main',()=>{this.flash(this.store.purchase(item.id)?'購買成功！':'金幣不足或背包已滿');render()}],['離開商店','close','ghost',()=>this.closeOverlay()]]);render()}
 useItem(){const p=this.player;const hp=this.store.useItem('healing_snack',p.hp,p.maxHp);if(hp===null){this.flash('目前無法使用恢復道具');return}p.hp=hp;this.flash('使用 Healing Snack：恢復 1 HP')}
 attack(){const p=this.player;if(p.attackTime>0)return;p.attackTime=.22;const hit={x:p.face>0?p.x+p.w:p.x-30,y:p.y+2,w:30,h:20};if(this.enemy?.alive&&overlap(hit,this.enemy)){this.enemy.alive=false;this.flash('敵人被擊退！')}}
 skill(){const p=this.player;if(p.dash>0||p.dashCooldown>0)return;if(!p.grounded&&!p.airDash)return;
 if(!p.grounded)p.airDash--;p.dash=.2;p.dashCooldown=.32;p.vx=p.face*310;p.vy=0;this.flash('Trick Dash！')}
 updatePlayer(dt){const p=this.player;const moving=Number(this.input.get('right'))-Number(this.input.get('left'));if(moving)p.face=moving;p.attackTime=Math.max(0,p.attackTime-dt);p.invuln=Math.max(0,p.invuln-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 if(p.dash>0){p.dash=Math.max(0,p.dash-dt);p.vx=p.face*310;p.vy=0}
 else{const max=this.input.get('run')?165:111;p.vx=moving*max;p.vy=Math.min(440,p.vy+720*dt);
 if(this.input.tap('jump')&&p.grounded){p.vy=-345;p.grounded=false}}
 const fromBottom=p.y+p.h;
 p.x+=p.vx*dt;
 for(const solid of WORLD.solids)if(overlap(p,solid)){if(p.vx>0)p.x=solid.x-p.w;else if(p.vx<0)p.x=solid.x+solid.w;p.vx=0;p.dash=0}
 p.x=clamp(p.x,0,VIEW.worldWidth-p.w);
 p.y+=p.vy*dt;p.grounded=false;
 for(const solid of WORLD.solids){if(overlap(p,solid)){
   if(p.vy>=0&&fromBottom<=solid.y+6){p.y=solid.y-p.h;p.vy=0;p.grounded=true}
   else if(p.vy<0){p.y=solid.y+solid.h;p.vy=0}
 }}
 for(const plat of WORLD.oneWays)if(p.vy>=0&&fromBottom<=plat.y+4&&p.y+p.h>=plat.y&&p.x+p.w>plat.x&&p.x<plat.x+plat.w){p.y=plat.y-p.h;p.vy=0;p.grounded=true}
 if(p.grounded)p.airDash=1;
 for(const coin of WORLD.coins){if(overlap(p,{x:coin.x-6,y:coin.y-8,w:12,h:15})&&this.store.collectCoin(coin.id))this.flash('獲得 1 枚金幣！')}
 const haz=WORLD.hazard;if(overlap(p,haz)&&p.invuln<=0){p.hp--;p.invuln=1; p.vy=-190;this.flash('小心陷阱！')}
 this.camera=clamp(this.camera+(clamp(p.x-150,0,VIEW.worldWidth-VIEW.width)-this.camera)*Math.min(1,dt*7),0,VIEW.worldWidth-VIEW.width);
 }
 updateEnemy(dt){const e=this.enemy;if(!e?.alive)return;e.x+=e.direction*18*dt;if(Math.abs(e.x-e.originX)>29)e.direction*=-1;
 if(overlap(this.player,e)&&this.player.invuln<=0){this.player.hp--;this.player.invuln=1;this.player.vy=-190;this.flash('受到傷害！')}
 }
 updateKuro(dt){const targetX=this.player.x-31,targetY=this.player.y-30+Math.sin(this.clock*4)*4;this.kuro.x+=(targetX-this.kuro.x)*Math.min(1,dt*3);this.kuro.y+=(targetY-this.kuro.y)*Math.min(1,dt*3)}
 respawn(){const cp=this.store.state.current_checkpoint;const anchor=cp.id==='Checkpoint'?WORLD.checkpoint:WORLD.start;const p=this.player;p.x=anchor.x;p.y=anchor.y-20;p.vx=0;p.vy=0;p.hp=p.maxHp;p.invuln=1.1;p.dash=0;this.flash('已返回檢查點')}
 complete(){this.scene='result';this.input.flush();this.touch.hidden=true;this.hud.hidden=true;this.menu.hidden=false;
 this.menuInner.innerHTML=`<div class="eyebrow">WORLD 1-1</div><div class="result-stars">✦ ✦ ✦</div><h1>關卡完成！</h1><p>東京・貓町測試關卡已通過。</p><p>金幣：${this.store.state.coins}</p><div class="menu-actions">${this.button('返回關卡選擇','levels','main')}${this.button('返回主畫面','title','ghost')}</div>`;this.store.save();this.bindActions({levels:()=>this.showLevelSelect(),title:()=>this.showTitle()})}
 flash(message){this.toast.textContent=message;this.toast.classList.add('show');clearTimeout(this.toastTimeout);this.toastTimeout=setTimeout(()=>this.toast.classList.remove('show'),1800)}
 hint(message){this.hud.querySelector('#hint-display').textContent=`KURO ✧ ${message}`}
 updateHud(){if(this.scene!=='game'||!this.player)return;
 this.hud.querySelector('#hp-display').textContent='♥ '.repeat(this.player.hp).trim()+' ♡ '.repeat(this.player.maxHp-this.player.hp);
 this.hud.querySelector('#coin-display').textContent=`◉ ${this.store.state.coins} · ITEM ${this.store.state.inventory.healing_snack||0}`;
 const quest=this.store.state.quests[QUEST.id];this.hud.querySelector('#quest-display').textContent=quest?.state==='active'?`${QUEST.title}：${quest.progress}/${QUEST.target_amount}`:quest?.state==='completed'?'任務完成 ✓':'';
 this.touch.style.opacity=String(this.store.settings.touch_opacity);
 const p=this.player;
 if(this.overlay)return;
 if(Math.abs(p.x-WORLD.checkpoint.x)<20&&this.store.state.current_checkpoint.id!=='Checkpoint'){this.store.setCheckpoint('Checkpoint');this.flash('檢查點已啟動！')}
 if(Math.abs(p.x-WORLD.npc.x)<38)this.hint('按 E / TALK 與教學貓對話');
 else if(Math.abs(p.x-WORLD.merchant.x)<45)this.hint('按 E / TALK 開啟商店');
 else if(Math.abs(p.x-WORLD.goal.x)<75)this.hint('抵達終點！');
 }
 draw(){const ctx=this.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#9fbfc0';ctx.fillRect(0,0,VIEW.width,VIEW.height);this.drawBackground();if(this.scene!=='game'&&this.scene!=='result')return;
 ctx.save();ctx.translate(-Math.round(this.camera),0);
 drawTokyoProps(ctx);
 for(const b of WORLD.solids)drawGround(ctx,b,b.y<220);
 for(const b of WORLD.oneWays){ctx.fillStyle='#a5b1bb';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#5e798d';ctx.fillRect(b.x,b.y+4,b.w,b.h-4)}
 const h=WORLD.hazard;ctx.fillStyle='#be756e';for(let x=h.x;x<h.x+h.w;x+=9){ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+4,h.y);ctx.lineTo(x+9,h.y+h.h);ctx.fill()}
 for(const coin of WORLD.coins){if(this.store.state?.collected_coins.includes(coin.id))continue;const bob=Math.round(Math.sin(this.clock*5+coin.x)*2);ctx.fillStyle='#f6db78';ctx.fillRect(coin.x-4,coin.y-7+bob,8,11);ctx.fillStyle='#a98345';ctx.fillRect(coin.x-1,coin.y-5+bob,2,7)}
 drawFriendlyCat(ctx,WORLD.npc.x,213);drawFriendlyCat(ctx,WORLD.merchant.x,212,true);
 this.drawSign(WORLD.npc.x,177,'對話','#a1d0cd');this.drawSign(WORLD.merchant.x,171,'SHOP','#edce89');
 this.drawSign(WORLD.checkpoint.x,215,'CP','#99c3af');this.drawSign(WORLD.goal.x,198,'GOAL','#f0d28b');
 if(this.enemy?.alive)this.drawPlaceholder(this.enemy.x,this.enemy.y,20,20,'!', '#a77479');
 if(this.player){const p=this.player;ctx.globalAlpha=p.invuln>0&&Math.floor(this.clock*15)%2===0?.45:1;
 drawCatPlaceholder(ctx,p);ctx.globalAlpha=1;
 if(p.attackTime>0){ctx.strokeStyle='#fff0a6';ctx.lineWidth=2;ctx.strokeRect(p.face>0?p.x+p.w:p.x-23,p.y+4,22,13)}
 drawKuro(ctx,this.kuro.x,this.kuro.y,this.clock);}
 ctx.restore();}
 drawBackground(){drawTokyoBackground(this.ctx,this.camera)}
 drawBlock(b,fill,edge){const ctx=this.ctx;ctx.fillStyle=fill;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle=edge;ctx.fillRect(b.x,b.y,b.w,5);ctx.fillStyle='#84a587';for(let x=b.x+10;x<b.x+b.w;x+=37)ctx.fillRect(x,b.y+9,7,3)}
 drawPlaceholder(x,y,w,h,label,color){const ctx=this.ctx;ctx.fillStyle='#243f4b';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,w+2,h+2);ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);ctx.fillStyle='#203945';ctx.fillRect(Math.round(x)+4,Math.round(y)+6,2,2);ctx.fillRect(Math.round(x)+12,Math.round(y)+6,2,2);ctx.font='bold 8px monospace';ctx.fillText(label,Math.round(x)+6,Math.round(y)+16)}
 drawSign(x,y,label,color){const ctx=this.ctx;ctx.fillStyle='#31505b';ctx.fillRect(x-1,y-26,2,26);ctx.fillStyle=color;const w=label.length*7+8;ctx.fillRect(x-w/2,y-38,w,13);ctx.fillStyle='#27424b';ctx.font='bold 9px monospace';ctx.fillText(label,x-w/2+4,y-28)}
}
