export const KEYMAP=Object.freeze({KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyS:'down',ArrowDown:'down',ShiftLeft:'run',ShiftRight:'run',Space:'jump',KeyW:'jump',KeyJ:'attack',KeyK:'skill',KeyE:'talk',KeyQ:'item',Escape:'pause',KeyP:'pause'});
const ACTIONS=new Set(['left','right','down','run','jump','attack','skill','talk','item','pause']);
export class Input{
 constructor(){this.keyboard=new Set();this.pointers=new Map();this.just=new Set();this.downSince={left:0,right:0};this.active=true;this.touchObserved=false;}
 get held(){const s=new Set(this.keyboard);for(const a of this.pointers.values())s.add(a);return s}
 get(a){if(a==='run'){const h=this.held;return h.has('run')||((h.has('left')||h.has('right'))&&Math.max(this.downSince.left||0,this.downSince.right||0)>0.55&&this.touchObserved)}return this.held.has(a)}
 tap(a){if(!this.just.has(a))return false;this.just.delete(a);return true}
 press(a,source='keyboard',id=null){if(!ACTIONS.has(a))return;const was=this.get(a);if(source==='keyboard')this.keyboard.add(a);else{this.pointers.set(id,a);this.touchObserved=true}if(!was)this.just.add(a);if((a==='left'||a==='right')&&!was)this.downSince[a]=0;}
 release(a,source='keyboard',id=null){if(source==='keyboard')this.keyboard.delete(a);else this.pointers.delete(id);if(!this.get(a)&&['left','right'].includes(a))this.downSince[a]=0}
 step(dt){for(const a of ['left','right'])if(this.held.has(a))this.downSince[a]+=dt;else this.downSince[a]=0}
 flush(){this.keyboard.clear();this.pointers.clear();this.just.clear();this.downSince.left=0;this.downSince.right=0}
 bindKeyboard(target=window){const codes=new Set(Object.keys(KEYMAP));target.addEventListener('keydown',e=>{if(!codes.has(e.code))return; e.preventDefault();this.press(KEYMAP[e.code]);});target.addEventListener('keyup',e=>{if(!codes.has(e.code))return;e.preventDefault();this.release(KEYMAP[e.code]);});target.addEventListener('blur',()=>this.flush());}
 bindTouch(root){for(const b of root.querySelectorAll('[data-action]')){
  const action=b.dataset.action;
  const reset=(e)=>{if(this.pointers.get(e.pointerId)===action){this.release(action,'pointer',e.pointerId);b.classList.remove('pressed')}if(b.hasPointerCapture?.(e.pointerId))b.releasePointerCapture(e.pointerId)};
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);this.press(action,'pointer',e.pointerId);b.classList.add('pressed')});
  b.addEventListener('pointerup',reset);b.addEventListener('pointercancel',reset);b.addEventListener('lostpointercapture',reset);
  b.addEventListener('contextmenu',e=>e.preventDefault());
 }
 }
}
