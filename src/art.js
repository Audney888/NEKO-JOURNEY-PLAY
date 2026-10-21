// Render-only development pixels; never an approved character sprite sheet.
// Positions/collision/quest systems remain in data.js and game.js.
const C={sky:'#dbe3d6',mist:'#eee1cb',cloud:'#fff3dc',far:'#9eb4af',mid:'#829f9a',roof:'#385965',ink:'#284652',plaster:'#e9dbc3',wood:'#896e5e',red:'#b66e66',green:'#57816b',gold:'#e6c27c'};
const px=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const label=(c,s,x,y,color=C.ink,n=9)=>{c.fillStyle=color;c.font='bold '+n+'px system-ui';c.fillText(s,Math.round(x),Math.round(y))};
function roof(c,x,y,w){px(c,x-5,y-4,w+10,4,C.roof);px(c,x-8,y,w+16,3,'#6f8686')}
function house(c,x,y,w,h,color='#e4d4bb'){
 px(c,x,y,w,h,color);roof(c,x,y,w);
 px(c,x+7,y+20,w-14,36,'#52717a');
 for(let j=0;j<3;j++){px(c,x+9+j*(w-19)/3,y+20,2,36,'#ae8e78');px(c,x+11+j*(w-19)/3,y+25,7,7,'#adc0b5')}
 px(c,x+7,y+59,w-14,4,C.wood);
 for(let j=0;j<4;j++)px(c,x+9+j*(w-18)/4,y+6,(w-18)/4-1,13,j%2?C.plaster:'#9c9e88');
 px(c,x+w-19,y+67,12,h-67,'#617d77')
}
function lantern(c,x,y){px(c,x,y,1,7,C.wood);px(c,x-4,y+7,9,2,C.roof);px(c,x-5,y+9,11,13,C.red);px(c,x-3,y+11,7,9,'#db9c7e');px(c,x-4,y+22,9,2,C.roof)}
function tree(c,x,y){px(c,x-2,y-26,5,26,'#79765e');px(c,x-15,y-42,31,16,'#5e816d');px(c,x-18,y-36,36,12,'#739680');px(c,x-12,y-48,24,12,'#8dad91')}
function arch(c,x,y){px(c,x,y-65,5,65,C.red);px(c,x+47,y-65,5,65,C.red);px(c,x-9,y-68,71,7,'#b06e66');px(c,x-12,y-72,77,4,'#73585a');px(c,x+5,y-53,43,3,C.gold)}
export function drawTokyoBackground(c,camera){
 px(c,0,0,480,270,C.sky);px(c,0,119,480,151,C.mist);
 for(const [u,y] of [[46,29],[270,47],[445,28]]){let x=u-(camera*.035%530);px(c,x,y,37,5,C.cloud);px(c,x+9,y-4,21,5,C.cloud)}
 const far=Math.round(camera*.1);
 for(let i=-2;i<20;i++){const x=i*47-(far%47),h=33+(i*11+170)%27;px(c,x,163-h,39,h,C.far);for(let j=0;j<2;j++)px(c,x+7+j*17,151-h+13,6,7,'#d1d9ce')}
 const mid=Math.round(camera*.22);
 for(let i=-2;i<14;i++){const x=i*96-(mid%96),h=60+(i*9+140)%23,y=214-h;px(c,x,y,84,h,i%2? '#a5b4a9':'#92a8a5');roof(c,x,y,84);for(let j=0;j<3;j++)px(c,x+14+j*23,y+16,12,17,'#729397')}
 px(c,0,211,480,19,'#98ada2');px(c,0,230,480,40,'#6c9183');
 for(let x=-((camera*.55)%28);x<500;x+=28)px(c,x,234,2,36,'#648579');
 px(c,375,24,98,17,'#f4e6c8');px(c,375,24,3,17,C.red);label(c,'東京・貓町  1-1',382,36,C.ink,9)
}
export function drawTokyoProps(c){
 house(c,34,120,105,110);lantern(c,55,149);lantern(c,122,149);
 house(c,232,134,89,96);tree(c,337,229);
 house(c,476,129,94,100);house(c,694,131,118,99);
 px(c,715,146,76,14,'#f6dda6');label(c,'喵喵上菜囉',719,157,C.ink,8);lantern(c,710,160);lantern(c,805,160);
 tree(c,832,229);arch(c,1210,230);tree(c,1344,230);
 house(c,1430,131,112,99);lantern(c,1510,148);
 for(const x of [1640,1850,2050])tree(c,x,230)
}
export function drawGround(c,b,raised=false){
 px(c,b.x,b.y,b.w,b.h,raised?'#817f75':'#688c76');
 px(c,b.x,b.y,b.w,4,raised?'#c9b99d':'#bdc79c');
 px(c,b.x,b.y+4,b.w,3,'#42675e');
 if(b.h>14)for(let x=b.x+10;x<b.x+b.w;x+=34)px(c,x,b.y+12,13,4,'#5a776c')
}
export function drawCatPlaceholder(c,p){
 const x=Math.round(p.x),y=Math.round(p.y);
 c.save();c.translate(x+(p.face<0?p.w:0),y);c.scale(p.face<0?-1:1,1);
 // Clearly provisional Bobo: orange tabby, ears, green scarf, bell, backpack and tail.
 px(c,-4,8,7,11,'#916844');px(c,-7,12,4,3,'#b07743');
 px(c,13,11,7,4,'#ad7140');px(c,18,7,3,8,'#c98e53');
 px(c,1,5,16,13,'#d88e4b');px(c,1,16,5,4,'#b8753f');px(c,12,16,5,4,'#b8753f');
 px(c,1,0,5,8,'#cd864b');px(c,12,0,5,8,'#cd864b');
 px(c,2,1,3,3,'#e9ae8a');px(c,13,1,3,3,'#e9ae8a');
 px(c,0,6,18,11,'#e3a460');px(c,2,7,3,2,'#ad693e');px(c,13,7,3,2,'#ad693e');
 px(c,4,10,3,2,'#687c49');px(c,12,10,3,2,'#687c49');px(c,8,12,3,2,'#5a423d');
 px(c,7,3,4,2,'#af6b3a');
 px(c,1,16,16,3,'#4c9066');px(c,8,17,3,3,'#edca7c');
 if(p.dash>0){px(c,-15,11,10,2,'#fff2c8');px(c,-10,16,6,2,'#e6e2bd')}
 c.restore()
}
export function drawFriendlyCat(c,x,y,merchant=false){
 x=Math.round(x);y=Math.round(y);const fur=merchant?'#b99b7a':'#93aaa2';
 px(c,x-7,y-15,5,8,fur);px(c,x+4,y-15,5,8,fur);
 px(c,x-8,y-9,18,15,fur);px(c,x-4,y-4,3,2,C.ink);px(c,x+4,y-4,3,2,C.ink);
 if(merchant)px(c,x-6,y+2,15,6,'#f4e1b5')
}
export function drawKuro(c,x,y,t){
 x=Math.round(x);y=Math.round(y+Math.sin(t*3)*2);
 px(c,x-3,y-6,9,9,'#2a3940');px(c,x-4,y-10,3,5,'#2a3940');px(c,x+4,y-10,3,5,'#2a3940');
 px(c,x-8,y-1,5,3,'#dfebdf');px(c,x+6,y-1,5,3,'#dfebdf');
 px(c,x-1,y-3,2,1,C.gold);px(c,x+3,y-3,2,1,C.gold);px(c,x-3,y-14,9,1,C.gold)
}
