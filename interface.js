// Interface-only controls share the existing artwork renderer and export path.
(()=>{
 const sequence=document.getElementById('sequence'),control=document.querySelector('.sequence-control');
 const dial=document.createElement('button');dial.type='button';dial.className='sequence-dial';dial.setAttribute('role','slider');dial.setAttribute('aria-label','Postcard sequence. Drag or use arrow keys.');dial.setAttribute('aria-valuemin','1');dial.setAttribute('aria-valuemax','12');control.prepend(dial);
 function select(n){setCard(Math.max(1,Math.min(12,n)))}
 dial.onkeydown=e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?1:e.key==='End'?12:+sequence.value+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1))}};
 let start=null;dial.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,n:+sequence.value};dial.setPointerCapture(e.pointerId)};dial.onpointermove=e=>{if(start)select(start.n+Math.round(((e.clientX-start.x)-(e.clientY-start.y))/14))};dial.onpointerup=dial.onpointercancel=()=>start=null;
 const palettes=[['ORIGIN','original','linear-gradient(90deg,#00aeef 50%,#ec008c 50%)'],['CYAN','#00aeef','#00aeef'],['MAGENTA','#ec008c','#ec008c'],['LIME','#c8ff35','#c8ff35'],['VIOLET','#9c6cff','#9c6cff'],['WHITE','#ffffff','#ffffff'],['CUSTOM','custom','linear-gradient(135deg,#00aeef,#ec008c)']];
 const chips=document.createElement('div');chips.className='ink-chips';chips.setAttribute('role','group');chips.setAttribute('aria-label','Ink presets');
 palettes.forEach(([name,value,color])=>{const b=document.createElement('button');b.type='button';b.className='ink-chip';b.dataset.palette=value;b.style.setProperty('--swatch',color);b.innerHTML=`<i aria-hidden="true"></i><span>${name}</span>`;b.setAttribute('aria-label',`${name} ink`);b.onclick=()=>{document.getElementById('palette').value=value;draw()};chips.append(b)});
 document.getElementById('palette').parentElement.after(chips);
 document.querySelectorAll('#controls input[type=range]').forEach(el=>{if(!el.getAttribute('aria-label')){const label=el.closest('label');if(label)el.setAttribute('aria-label',label.firstChild.textContent.trim())}});
 window.syncDesign=()=>{const n=+sequence.value;dial.textContent=String(n).padStart(2,'0');dial.setAttribute('aria-valuenow',n);dial.setAttribute('aria-valuetext',`${n} of 12, ${cardNames[n-1]}`);dial.style.setProperty('--dial-angle',((n-1)/12*360)+'deg');document.querySelectorAll('.ink-chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.palette===document.getElementById('palette').value)));document.querySelectorAll('input[type=range]').forEach(el=>{el.style.setProperty('--fill',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%')})};
 window.syncDesign();
})();
// Revisit the cyan echo composition highlighted in the design review.
(()=>{const b=document.createElement('button');b.type='button';b.textContent='CYAN ECHO ↗';b.onclick=()=>{
 dx=dy=phase=0;playing=false;$('play').textContent='▶ PLAY';$('play').setAttribute('aria-pressed','false');
 const values={layout:'grid',count:5,gap:63,scale:115,axis:0,angle:0,effect:'echo',deform:59,overlayCard:9,palette:'#00aeef',secondColor:'#00d9dd',mix:60,offset:190,bodyFill:55,strokeWidth:0,renderStyle:'ink',frontPasses:3,backStyle:'body',backFill:55,backWeight:0,backPasses:2,lineSpread:18,blend:'screen',hue:0,saturation:100};
 for(const[id,value]of Object.entries(values))$(id).value=value;setCard(2);$('status').textContent='CYAN ECHO / original composition with adjustable body fill.';
};document.querySelector('.motion-actions').append(b)})();

(()=>{const b=document.createElement('button');b.type='button';b.textContent='HUMAN / TRIPLE LINE ↗';b.onclick=()=>{playing=false;phase=dx=dy=0;$('play').textContent='▶ PLAY';$('play').setAttribute('aria-pressed','false');const v={layout:'single',count:1,effect:'echo',deform:18,scale:145,axis:0,angle:0,renderStyle:'ink',frontPasses:3,strokeWidth:0,lineSpread:18,overlayCard:1,backStyle:'body',backFill:50,backWeight:0,mix:55,offset:195,palette:'#ffffff',secondColor:'#ec008c',blend:'screen',hue:0,saturation:100};for(const[id,value]of Object.entries(v))$(id).value=value;setCard(4);$('status').textContent='HUMAN / three fine contours over a filled background specimen.'};document.querySelector('.motion-actions').append(b)})();
