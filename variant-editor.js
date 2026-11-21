/* Independent vector objects; each library canvas remembers its own arrangement. */
window.createVariantEditor=({panel,names,getVectors,redraw})=>{
 const scenes=new Map();let current='17',selected=null,serial=0,drag=null,portraitKey='',selectedIds=new Set(),groupAngle=0,lastPalette=-1,paletteHistory=[];
 const $=id=>document.getElementById(id),art=n=>`assets/previews/graphic-${String(n).padStart(2,'0')}.webp`;
 const title=n=>(n==='portrait'?'MY PORTRAIT':names[n]||(n>=6&&n<=10?names[n-5]+' / VARIATION':'GRAPHIC '+n)).toUpperCase();
 function makeObject(source,props={}){const o={id:++serial,source:+source,x:700,y:550,baseSize:780,scale:100,angle:0,front:'#ec008c',back:'#00aeef',frontStyle:'line',backStyle:'fill',offset:18,copies:1,opacity:100,...props};o.initial={...o};return o}
 function initialScene(source){return{objects:[makeObject(source)],width:1400,height:1100}}
 function scene(){if(!scenes.has(current))scenes.set(current,initialScene(+current));return scenes.get(current)}
 function targets(){return scene().objects.filter(o=>selectedIds.has(o.id))}
 function select(ids){selectedIds=new Set(ids);selected=ids[ids.length-1]??null;groupAngle=0}
 function active(){return scene().objects.find(o=>o.id===selected)||null}
 const numbered=n=>String(n).padStart(2,'0')+' / '+title(n);
 const optionGroups='<optgroup label="DISEASE / BASIC + VARIATION">'+Array.from({length:10},(_,i)=>`<option value="${i+1}">${numbered(i+1)}</option>`).join('')+'</optgroup><optgroup label="HUMAN / ORIGINAL ARTBOARDS">'+[11,12,13,14,15,16,17].map(n=>`<option value="${n}">${numbered(n)}</option>`).join('')+'</optgroup>';
 panel.innerHTML=`<div class="native-panel-top"><span class="eyebrow">VARIANT / CANVAS</span><button type="button" id="nativeReset">RESET OBJECT ↺</button></div><label>CANVAS<select id="nativeSource"><option value="portrait" disabled>MY PORTRAIT / COMPLETE QUIZ</option>${optionGroups}</select></label><button type="button" id="addGraphic" class="add-graphic">ADD GRAPHIC +</button><div id="graphicLibrary" class="graphic-library" hidden><div class="library-title"><span>ADD TO THIS CANVAS</span><button type="button" id="closeLibrary">×</button></div><div id="graphicLibraryItems"></div></div><div class="layer-heading"><span>GRAPHICS</span><span id="objectCount">1</span></div><div id="objectList" class="object-list" aria-label="Canvas graphics"></div><div class="selected-object-title" id="selectedObjectTitle">SELECT A GRAPHIC</div><fieldset id="objectOptions"><div class="object-order"><button type="button" id="objectBack">BACK ↓</button><button type="button" id="objectFront">FRONT ↑</button><button type="button" id="objectRemove">REMOVE ×</button></div><div class="layer-setting"><span>01 / FRONT</span><input aria-label="Front colour" id="nativeFront" type="color" value="#ec008c"><select id="nativeFrontStyle" aria-label="Front surface"><option value="native">ORIGINAL FORM</option><option value="line">FINE LINE</option><option value="fill">FILLED FORM</option></select></div><div class="layer-setting"><span>02 / BACK</span><input aria-label="Back colour" id="nativeBack" type="color" value="#00aeef"><select id="nativeBackStyle" aria-label="Back surface"><option value="off">OFF</option><option value="fill">FILLED FORM</option><option value="line">FINE LINE</option><option value="native">ORIGINAL FORM</option></select></div><label>REGISTRATION OFFSET <output id="nativeOffsetValue">18</output><input id="nativeOffset" type="range" min="0" max="65" value="18"></label><label>OPACITY <output id="nativeOpacityValue">100%</output><input id="nativeOpacity" type="range" min="10" max="100" value="100"></label><div class="impressions-row"><span>IMPRESSIONS</span><div class="impression-stepper"><button type="button" id="copiesMinus" aria-label="Fewer impressions">−</button><output id="nativeCopies" aria-live="polite">1</output><button type="button" id="copiesPlus" aria-label="More impressions">+</button></div></div><button type="button" id="nativeShuffle" class="new-object-inks">NEW COLOUR PAIR ↗</button></fieldset><div class="native-actions"><button type="button" id="nativeSave" class="solid">SAVE PNG ↗</button></div><p class="native-caption">Click to select / drag to move.<br>Options apply to the selected graphic.</p>`;
 panel.prepend(panel.querySelector('.native-actions'));
 $('objectOptions').prepend(panel.querySelector('.impressions-row'));
 $('objectList').after(panel.querySelector('.object-order'));
 $('nativeOffset').closest('label').before($('nativeShuffle'));
 panel.querySelector('.native-caption').innerHTML='Drag to move · corners to resize.<br>Drag the round handle to rotate.';
 const props=['front','back','frontStyle','backStyle','offset','opacity'];
 function sync(){const o=active();$('nativeSource').value=current;$('objectOptions').disabled=!scene().objects.length;$('nativeReset').disabled=!o;for(const id of ['objectBack','objectFront','objectRemove'])$(id).disabled=!o;$('selectedObjectTitle').textContent=targets().length>1?'ALL GRAPHICS / '+targets().length+' SELECTED':o?'SELECTED '+String(scene().objects.indexOf(o)+1).padStart(2,'0')+' / '+title(o.source):'SELECT A GRAPHIC';$('objectCount').textContent=scene().objects.length;
  for(const key of props){const el=$('native'+key[0].toUpperCase()+key.slice(1));el.disabled=!o;if(o)el.value=o[key];if(el.type==='range')syncRangeFill(el)}
  $('nativeBack').disabled=!o||o.backStyle==='off';$('nativeOffset').disabled=!o||o.backStyle==='off';
  if(o){$('nativeOffsetValue').textContent=o.offset;$('nativeOpacityValue').textContent=o.opacity+'%';$('nativeCopies').textContent=o.copies;$('copiesMinus').disabled=o.copies<=1;$('copiesPlus').disabled=o.copies>=8}
  $('copiesMinus').disabled=!o||o.copies<=1;$('copiesPlus').disabled=!o||o.copies>=8;
  const list=$('objectList');list.replaceChildren();scene().objects.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='object-chip';b.setAttribute('aria-pressed',String(selectedIds.has(item.id)));b.setAttribute('aria-label',`Select graphic ${i+1}: ${title(item.source)}`);b.innerHTML=`<img src="${art(item.source)}" alt=""><span>${String(i+1).padStart(2,'0')}</span>`;b.onclick=()=>{select([item.id]);sync();redraw()};list.append(b)})
 }
 function chooseCanvas(value){current=String(value);const s=scene();select(s.objects.length?[s.objects[s.objects.length-1].id]:[]);$('graphicLibrary').hidden=true;sync();redraw()}
 $('nativeSource').onchange=e=>chooseCanvas(e.target.value);
 props.forEach(key=>{$('native'+key[0].toUpperCase()+key.slice(1)).oninput=e=>{const o=active();if(!o)return;for(const item of targets())item[key]=['offset','opacity'].includes(key)?+e.target.value:e.target.value;sync();redraw()}});
 $('copiesMinus').onclick=()=>{const o=active();if(o&&o.copies>1){for(const item of targets())item.copies=Math.max(1,item.copies-1);sync();redraw()}};$('copiesPlus').onclick=()=>{const o=active();if(o&&o.copies<8){for(const item of targets())item.copies=Math.min(8,item.copies+1);sync();redraw()}};
 $('nativeReset').onclick=()=>{const o=active();if(o){for(const item of targets()){const initial=item.initial;Object.assign(item,initial);item.initial=initial}groupAngle=0;sync();redraw()}};
 $('objectBack').onclick=()=>{const a=scene().objects;for(let i=1;i<a.length;i++)if(selectedIds.has(a[i].id)&&!selectedIds.has(a[i-1].id))[a[i-1],a[i]]=[a[i],a[i-1]];sync();redraw()};
 $('objectFront').onclick=()=>{const a=scene().objects;for(let i=a.length-2;i>=0;i--)if(selectedIds.has(a[i].id)&&!selectedIds.has(a[i+1].id))[a[i],a[i+1]]=[a[i+1],a[i]];sync();redraw()};
 $('objectRemove').onclick=()=>{const s=scene();s.objects=s.objects.filter(o=>!selectedIds.has(o.id));select(s.objects.length?[s.objects[s.objects.length-1].id]:[]);sync();redraw()};
 // Each palette has light / medium / deep roles. Mixed-hue families include
 // complementary, split-complementary and warm/cool combinations on a dark ground.
 const palettes=[
  ['#fff0c7','#ffbd69','#e66d68'], // cream / amber / coral (reference)
  ['#ffe0c2','#f29277','#357f87'], // apricot / coral / teal
  ['#f6edcf','#72c8d5','#bb6265'], // ivory / aqua / muted red
  ['#ffe6cc','#f6a579','#6873a8'], // peach / terracotta / indigo
  ['#d9f5e4','#69c6ba','#8065a4'], // mint / teal / plum
  ['#e3e4ff','#bba2e5','#b95b89'], // ice lavender / lilac / berry
  ['#fff5b8','#b3cd69','#527b63'], // lemon / lime / forest
  ['#e2f2ff','#77b7e3','#bd7350'], // ice / sky / copper
  ['#ffd9e5','#f29cbd','#aa5978'], // blush / rose / wine
  ['#eef1dc','#a9bc83','#667b9d'], // pale sage / olive / slate
  ['#f8f3e8','#e3be76','#4d7ca7'], // paper / gold / blue
  ['#ffd6db','#edac8c','#5a8e84'], // pink / peach / jade
  ['#dcf5f2','#69c9d2','#8d69a6'], // ice mint / cyan / violet
  ['#eee1f6','#c09ee0','#8b6297'], // pale violet / lavender / plum
  ['#e8efd9','#a5c6a5','#b87558'], // ivory green / sage / rust
  ['#dfe5ff','#7fa5e7','#c36086'], // periwinkle / blue / raspberry
  ['#ffe5d1','#edb470','#3f898c'], // warm ivory / ochre / petrol
  ['#f9e7bd','#c6b582','#7b779c']  // parchment / sand / smoky violet
 ];
 function shuffled(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
 $('nativeShuffle').onclick=()=>{const objects=scene().objects;if(!objects.length)return;
  // Avoid repeating the last four palettes. Prefer a fresh set of colours even
  // when individual objects have previously been recoloured by hand.
  let candidates=palettes.map((p,i)=>i).filter(i=>!paletteHistory.includes(i)&&!palettes[i].some(c=>objects.some(o=>o.front===c||o.back===c)));
  if(!candidates.length)candidates=palettes.map((p,i)=>i).filter(i=>i!==lastPalette);
  const index=candidates[Math.floor(Math.random()*candidates.length)],palette=palettes[index];lastPalette=index;paletteHistory.push(index);if(paletteHistory.length>4)paletteHistory.shift();
  // Deal all three tonal roles before repeating any of them. Unlike independent
  // random picks, a canvas with 3+ objects cannot collapse to just one or two tones.
  const roleOrder=shuffled([0,1,2]),roles=shuffled(objects.map((o,i)=>roleOrder[i%3]));
  objects.forEach((o,i)=>{const role=roles[i];o.front=palette[role];const backs=palette.filter((c,j)=>j!==role&&c!==o.back);o.back=backs[Math.floor(Math.random()*backs.length)]});
  select(objects.map(o=>o.id));sync();redraw();
 };
 $('nativeSave').onclick=()=>$('save').click();$('addGraphic').onclick=()=>{$('graphicLibrary').hidden=!$('graphicLibrary').hidden};$('closeLibrary').onclick=()=>$('graphicLibrary').hidden=true;
 for(let n=1;n<=17;n++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Add '+numbered(n));b.innerHTML=`<img src="${art(n)}" alt="" loading="lazy" decoding="async"><span>${numbered(n)}</span>`;b.onclick=()=>{const s=scene(),i=s.objects.length,o=makeObject(n,{x:s.width/2+((i%3)-1)*70,y:s.height/2+((i%2)*2-1)*45,baseSize:440,frontStyle:'native',backStyle:'off',front:i%2?'#ec008c':'#00aeef'});s.objects.push(o);select([o.id]);$('graphicLibrary').hidden=true;sync();redraw()};$('graphicLibraryItems').append(b)}
 function objectElements(o){const list=[],size=o.baseSize*o.scale/100,rotation=o.angle*Math.PI/180;for(let i=0;i<o.copies;i++){const pair=n=>n<=5?n+5:n<=10?n-5:n,primary=i%2?pair(o.source):o.source;const sx=(i-(o.copies-1)/2)*size*.42,sy=o.copies===1?0:i%2?size*.035:-size*.035,x=o.x+sx*Math.cos(rotation)-sy*Math.sin(rotation),y=o.y+sx*Math.sin(rotation)+sy*Math.cos(rotation);
  if(o.backStyle!=='off')list.push({objectId:o.id,id:pair(primary),x:x+o.offset,y:y+o.offset*.4,size,colour:o.back,style:o.backStyle,alpha:o.opacity/100,angle:rotation});
  list.push({objectId:o.id,id:primary,x:x-(o.backStyle==='off'?0:o.offset),y:y-(o.backStyle==='off'?0:o.offset*.4),size,colour:o.front,style:o.frontStyle,alpha:o.opacity/100,angle:rotation,minStroke:.72});
 }return list}
 function plan(){return scene().objects.flatMap(objectElements)}
 function bounds(o){const vectors=getVectors();let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(const e of objectElements(o)){const g=vectors[e.id-1];if(!g)continue;const scale=e.size/Math.max(g.width,g.height),w=g.width*scale,h=g.height*scale,a=e.angle||0,ww=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h)/2,hh=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h)/2;left=Math.min(left,e.x-ww);right=Math.max(right,e.x+ww);top=Math.min(top,e.y-hh);bottom=Math.max(bottom,e.y+hh)}return{left,right,top,bottom}}
 function point(e){const canvas=$('canvas'),r=canvas.getBoundingClientRect(),s=scene(),scale=Math.min(r.width/s.width,r.height/s.height),left=r.left+(r.width-s.width*scale)/2,top=r.top+(r.height-s.height*scale)/2;return{x:(e.clientX-left)/scale,y:(e.clientY-top)/scale}}
 // Selection geometry follows the object's rotation. A group uses one frame
 // and one pivot, so all relative positions are preserved during transforms.
 const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
 const screenScale=()=>{const r=$('canvas').getBoundingClientRect(),s=scene();return Math.min(r.width/s.width,r.height/s.height)||1};
 function frame(){
  const objects=targets();if(!objects.length)return null;
  const angle=objects.length===1?objects[0].angle*Math.PI/180:groupAngle;
  let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;const vectors=getVectors();
  for(const o of objects)for(const e of objectElements(o)){const g=vectors[e.id-1];if(!g)continue;
   const size=e.size/Math.max(g.width,g.height),w=g.width*size/2,h=g.height*size/2;
   for(const [x,y]of[[-w,-h],[w,-h],[w,h],[-w,h]]){const q=rotate({x,y},e.angle||0),v=rotate({x:q.x+e.x,y:q.y+e.y},-angle);l=Math.min(l,v.x);r=Math.max(r,v.x);t=Math.min(t,v.y);b=Math.max(b,v.y)}
  }
  if(!Number.isFinite(l))return null;const padding=7/screenScale(),center=rotate({x:(l+r)/2,y:(t+b)/2},angle);
  return {x:center.x,y:center.y,w:r-l+padding*2,h:b-t+padding*2,angle};
 }
 function fromFrame(f,x,y){const p=rotate({x,y},f.angle);return{x:f.x+p.x,y:f.y+p.y}}
 function handles(f){return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>fromFrame(f,x*f.w/2,y*f.h/2))}
 function handleHit(p,f){if(!f)return null;const radius=11/screenScale(),corners=handles(f),rotation=fromFrame(f,0,-f.h/2-28/screenScale());
  if(Math.hypot(p.x-rotation.x,p.y-rotation.y)<radius)return{kind:'rotate'};
  for(let i=0;i<corners.length;i++)if(Math.hypot(p.x-corners[i].x,p.y-corners[i].y)<radius)return{kind:'scale',index:i};return null;
 }
 function inside(p,f){if(!f)return false;const q=rotate({x:p.x-f.x,y:p.y-f.y},-f.angle);return Math.abs(q.x)<=f.w/2&&Math.abs(q.y)<=f.h/2}
 function pointerDown(e){if(e.button!==0)return;const p=point(e);let f=frame(),hit=handleHit(p,f);
  if(!hit&&!inside(p,f)){let found=null;for(const o of [...scene().objects].reverse()){const b=bounds(o);if(p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom){found=o;break}}select(found?[found.id]:[]);f=frame()}
  if(f){drag={kind:hit?.kind||'move',start:p,frame:f,angle:Math.atan2(p.y-f.y,p.x-f.x),groupAngle,objects:targets().map(o=>({o,x:o.x,y:o.y,scale:o.scale,angle:o.angle}))};
   if(hit?.kind==='scale'){const corners=handles(f);drag.handle=corners[hit.index];drag.anchor=corners[(hit.index+2)%4]}
   $('canvas').setPointerCapture(e.pointerId);$('canvas').style.cursor=hit?.kind==='rotate'?'crosshair':hit?'nwse-resize':'grabbing';
  }sync();redraw();
 }
 function pointerMove(e){const p=point(e);
  if(!drag){const f=frame(),hit=handleHit(p,f);$('canvas').style.cursor=hit?.kind==='rotate'?'crosshair':hit?'nwse-resize':inside(p,f)?'grab':'default';return}
  const d=drag;
  if(d.kind==='scale'){
   const v={x:d.handle.x-d.anchor.x,y:d.handle.y-d.anchor.y},length=v.x*v.x+v.y*v.y;
   const min=Math.max(...d.objects.map(s=>20/s.scale)),max=Math.min(...d.objects.map(s=>240/s.scale));
   const factor=Math.max(min,Math.min(max,((p.x-d.anchor.x)*v.x+(p.y-d.anchor.y)*v.y)/(length||1)));
   for(const s of d.objects){s.o.scale=s.scale*factor;s.o.x=d.anchor.x+(s.x-d.anchor.x)*factor;s.o.y=d.anchor.y+(s.y-d.anchor.y)*factor}
  }else if(d.kind==='rotate'){
   let delta=Math.atan2(p.y-d.frame.y,p.x-d.frame.x)-d.angle;delta=Math.atan2(Math.sin(delta),Math.cos(delta));
   for(const s of d.objects){const v=rotate({x:s.x-d.frame.x,y:s.y-d.frame.y},delta);s.o.x=d.frame.x+v.x;s.o.y=d.frame.y+v.y;s.o.angle=s.angle+delta*180/Math.PI}
   groupAngle=d.groupAngle+delta;
  }else{
   const s=scene();let x=p.x-d.start.x,y=p.y-d.start.y;
   // Use the original frame, not changing live bounds, to avoid drag drift.
   const corners=handles(d.frame),left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
   if(right-left<s.width-20)x=Math.max(10-left,Math.min(s.width-10-right,x));if(bottom-top<s.height-20)y=Math.max(10-top,Math.min(s.height-10-bottom,y));
   for(const item of d.objects){item.o.x=item.x+x;item.o.y=item.y+y}
  }
  redraw();
 }
 function pointerUp(){drag=null;$('canvas').style.cursor='grab';sync()}
 function paintSelection(k){const f=frame();if(!f)return;const scale=screenScale(),handle=5/scale,gap=28/scale;
  k.save();k.translate(f.x,f.y);k.rotate(f.angle);k.strokeStyle='#76d8fb';k.fillStyle='#080c0f';k.lineWidth=1.2/scale;k.setLineDash([5/scale,5/scale]);k.strokeRect(-f.w/2,-f.h/2,f.w,f.h);k.setLineDash([]);
  for(const[x,y]of[[-f.w/2,-f.h/2],[f.w/2,-f.h/2],[f.w/2,f.h/2],[-f.w/2,f.h/2]]){k.fillRect(x-handle,y-handle,handle*2,handle*2);k.strokeRect(x-handle,y-handle,handle*2,handle*2)}
  k.beginPath();k.moveTo(0,-f.h/2);k.lineTo(0,-f.h/2-gap);k.stroke();k.beginPath();k.arc(0,-f.h/2-gap,handle*1.15,0,Math.PI*2);k.fill();k.stroke();k.restore();
  $('canvas').setAttribute('aria-description',targets().length+' selected. Drag corners to resize; drag the round handle to rotate.');
 }
 chooseCanvas('17');
 return{
  setPortrait(elements,key,frame){if(key!==portraitKey){portraitKey=key;scenes.set('portrait',{width:frame[0],height:frame[1],objects:elements.map(e=>makeObject(e.id,{x:e.x,y:e.y,baseSize:e.size,angle:(e.angle||0)*180/Math.PI,front:e.colour,frontStyle:e.style,backStyle:'off',opacity:Math.round(e.alpha*100)}))})}const option=$('nativeSource').querySelector('option[value="portrait"]');option.disabled=false;option.textContent='MY PORTRAIT'},
  exportState:()=>({source:current,objects:scene().objects.map(o=>({id:o.id,source:o.source,x:o.x,y:o.y,size:o.baseSize*o.scale/100,angle:o.angle*Math.PI/180,impressions:o.copies,opacity:o.opacity/100}))}),
  enter(preferred){chooseCanvas(preferred!==undefined?preferred:current)},plan,frame:()=>[scene().width,scene().height],pointerDown,pointerMove,pointerUp,paintSelection,
  wheel(e){if(targets().length){for(const o of targets())o.scale=Math.max(20,Math.min(240,o.scale-Math.sign(e.deltaY)*5));redraw()}},
  label:()=>title(current).toUpperCase(),status:()=>scene().objects.length+' GRAPHICS / '+(targets().length>1?'ALL '+targets().length+' SELECTED':active()?'SELECTED '+String(scene().objects.indexOf(active())+1).padStart(2,'0'):'CLICK TO SELECT')
 };
};
