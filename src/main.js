import {NekoGame} from './game.js';
const byId=id=>document.getElementById(id);
const game=new NekoGame({canvas:byId('game'),menu:byId('menu'),menuInner:byId('menu-inner'),hud:byId('hud'),touch:byId('touch-controls'),rotate:byId('rotate'),toast:byId('toast')});
// Test-only read-only observability; no production game-state write access.
if(new URL(location.href).searchParams.has('debug')){
  Object.defineProperty(window,'__NEKO_DEBUG__',{value:{get scene(){return game.scene},get x(){return game.player?.x??null},get hp(){return game.player?.hp??null},get coins(){return game.store.state?.coins??null},get overlay(){return game.overlay},get saved(){return game.store.hasSave()}}});
}
game.run();
