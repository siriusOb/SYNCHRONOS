/* The export keeps one frozen composition for artwork, naming and inventory. */
(()=>{
 const catalogue={
  1:{name:'OVERSTIMULATION',trait:'INFORMATION OVERLOAD',words:['branching','diffuse','restless']},
  2:{name:'MALFUNCTION',trait:'OUT OF CONTROL',words:['fractured','shifting','irregular']},
  3:{name:'PARALYSIS',trait:'EXTERNAL STIMULATION',words:['suspended','quiet','porous']},
  4:{name:'ATTRITION',trait:'RUN OUT',words:['lingering','fading','residual']},
  5:{name:'COMPULSION',trait:'DIGITAL HOARDING',words:['layered','recurring','gathering']},
  11:{name:'SURVIVOR',trait:'STONE AGE / COOPERATION',words:['shared','sheltered','enduring']},
  12:{name:'ORGANIZER / KING',trait:'CIVILIZATION AGE / AUTHORITY',words:['ordered','structured','central']},
  13:{name:'ORGANIZER / SUBJECT',trait:'CIVILIZATION AGE / COMMUNITY',words:['collective','woven','nested']},
  14:{name:'INVENTOR / MASTER',trait:'INDUSTRIAL AGE / INVENTION',words:['constructed','shaped','driven']},
  15:{name:'INVENTOR / OPERATIVE',trait:'INDUSTRIAL AGE / OPERATION',words:['repeated','working','measured']},
  16:{name:'COMMUNICATER',trait:'INFORMATION AGE / CONNECTION',words:['connected','crossing','networked']},
  17:{name:'HOMO SYNCHRONOS',trait:'SYNCHRONIZATION / NETWORKED LIFE',words:['synchronous','converging','interwoven']}
 };
 const family=id=>id>=6&&id<=10?id-5:id;
 const lookup=id=>catalogue[family(id)]||{name:'GRAPHIC '+id,trait:'ORIGINAL GRAPHIC FORM',words:['shifting','gathering','layered']};
 function hash(value){let result=2166136261;for(const char of value){result^=char.charCodeAt(0);result=Math.imul(result,16777619)}return result>>>0}
 function compositionTitle(snapshot){
  if(snapshot.origin==='portrait'&&snapshot.portraitTitle)return snapshot.portraitTitle;
  const items=snapshot.items;
  if(items.length===1){const id=items[0].source;return lookup(id).name+(id>=6&&id<=10?' / VARIATION':'')}
  if(!items.length)return 'Untitled portrait';
  // Colour and selection changes do not rename a composition. Its arrangement
  // and source forms give it a reproducible name on every subsequent save.
  const seed=hash(JSON.stringify(items.map(o=>[o.source,Math.round(o.x),Math.round(o.y),Math.round(o.size),Math.round((o.angle||0)*180/Math.PI),o.impressions||1])));
  const dominant=[...items].sort((a,b)=>b.size*b.size*(b.opacity??1)*(b.impressions||1)-a.size*a.size*(a.opacity??1)*(a.impressions||1))[0];
  const x=items.reduce((n,o)=>n+o.x,0)/items.length,y=items.reduce((n,o)=>n+o.y,0)/items.length;
  const spread=Math.sqrt(items.reduce((n,o)=>n+(o.x-x)**2+(o.y-y)**2,0)/items.length)/Math.max(...snapshot.dimensions);
  const nouns=spread<.11?['current','echo','cluster']:spread>.23?['constellation','field','atlas']:['field','pattern','trace'];
  return 'The '+lookup(dominant.source).words[seed%3]+' '+nouns[Math.floor(seed/3)%3];
 }
 function describe(snapshot){
  const rows=new Map();
  for(const item of snapshot.items){const id=family(item.source);if(!rows.has(id))rows.set(id,{family:id,...lookup(id),quantity:0,sources:new Set()});
   const row=rows.get(id);row.quantity+=item.impressions||1;
   const elements=item.id===undefined?[]:snapshot.elements.filter(e=>e.objectId===item.id);
   for(const source of elements.length?elements.map(e=>e.id):[item.source])row.sources.add(source);
  }
  const entries=[...rows.values()].sort((a,b)=>a.family-b.family).map(row=>({...row,sources:[...row.sources].sort((a,b)=>a-b)}));
  for(const row of entries)if(row.sources.every(id=>id>=6&&id<=10))row.name+=' / VARIATION';
  return {title:compositionTitle(snapshot),kind:snapshot.origin==='portrait'?'PERSONAL PORTRAIT':snapshot.items.length===1?'GRAPHIC STUDY':'COMPOSITE PORTRAIT',
   entries,total:entries.reduce((sum,row)=>sum+row.quantity,0),families:entries.length};
 }
 const font='"Synchronos Typewriter", "American Typewriter", Georgia, serif';
 function setType(k,size,colour='#f1f0e9',align='left'){k.fillStyle=colour;k.font=`400 ${size}px ${font}`;k.textAlign=align}
 function text(k,value,x,y,size=25,colour='#f1f0e9',align='left'){setType(k,size,colour,align);k.fillText(value,x,y);k.textAlign='left'}
 function wrap(k,value,width,size){
  setType(k,size);const lines=[];let line='';
  for(const word of value.split(/\s+/)){const next=line?line+' '+word:word;if(k.measureText(next).width>width&&line){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);return lines;
 }
 function divider(k,y){k.save();k.strokeStyle='#788381';k.lineWidth=1.3;k.setLineDash([6,7]);k.beginPath();k.moveTo(80,y);k.lineTo(920,y);k.stroke();k.restore()}
 function graphic(snapshot,black=false){
  const canvas=document.createElement('canvas');canvas.width=2800;canvas.height=Math.round(2800*snapshot.dimensions[1]/snapshot.dimensions[0]);
  if(!window.renderNative(canvas.getContext('2d'),canvas.width,canvas.height,false,black?{...snapshot,background:'#000000'}:snapshot))throw Error('The original artwork could not be rendered.');
  return canvas;
 }
 function receipt(snapshot,metadata){
  const art=graphic(snapshot,true),measuring=document.createElement('canvas').getContext('2d');
  const artHeight=1000*snapshot.dimensions[1]/snapshot.dimensions[0],artBottom=290+artHeight;
  const title=wrap(measuring,metadata.title,840,82),titleY=artBottom+150;
  const titleBottom=titleY+(title.length-1)*91,ruleY=titleBottom+110,headerY=ruleY+57;
  let nextY=headerY+61;
  const rows=metadata.entries.map(row=>{
   const names=wrap(measuring,row.name,620,30),traits=wrap(measuring,row.trait,620,21),y=nextY;
   const height=Math.max(138,39+names.length*36+traits.length*28+20);nextY+=height;
   return {row,names,traits,y,height};
  });
  const end=nextY,height=Math.ceil(end+376),canvas=document.createElement('canvas');canvas.width=1400;canvas.height=Math.ceil(height*1.4);
  const k=canvas.getContext('2d');k.fillStyle='#000000';k.fillRect(0,0,canvas.width,canvas.height);k.scale(1.4,1.4);
  text(k,'SYNCHRONOS',500,113,40,'#f1f0e9','center');text(k,'A CONTEMPORARY HUMAN REPORT',500,158,19,'#a8b1ac','center');divider(k,204);
  text(k,metadata.kind,80,260,21,'#a8b1ac');text(k,metadata.total+' '+(metadata.total===1?'FORM':'FORMS'),920,260,21,'#a8b1ac','right');
  k.drawImage(art,0,290,1000,artHeight);
  text(k,snapshot.origin==='study'&&snapshot.items.length===1?'GRAPHIC STUDY':'YOUR PORTRAIT',80,artBottom+65,19,'#a8b1ac');
  title.forEach((line,i)=>text(k,line,80,titleY+i*91,82));divider(k,ruleY);
  text(k,'GRAPHIC / CHARACTERISTIC',80,headerY,19,'#a8b1ac');text(k,'QTY',920,headerY,19,'#a8b1ac','right');
  for(const {row,names,traits,y}of rows){
   const thumbWidth=row.sources.length>1?62:112;
   row.sources.forEach((id,index)=>window.renderNativeStamp(k,id,80+index*65,y+7,thumbWidth,100));
   text(k,row.sources.map(id=>String(id).padStart(2,'0')).join(' + '),240,y,19,'#a8b1ac');
   names.forEach((line,i)=>text(k,line,240,y+39+i*36,30));
   const traitY=y+39+names.length*36;
   traits.forEach((line,i)=>text(k,line,240,traitY+i*28,21,'#a8b1ac'));
   text(k,String(row.quantity).padStart(2,'0'),920,y+39,27,'#f1f0e9','right');
  }
  divider(k,end+6);text(k,'TOTAL FORMS',80,end+64,23);text(k,String(metadata.total).padStart(2,'0'),920,end+64,27,'#f1f0e9','right');
  text(k,'GRAPHIC FAMILIES',80,end+112,21,'#a8b1ac');text(k,String(metadata.families).padStart(2,'0'),920,end+112,23,'#a8b1ac','right');divider(k,end+158);
  text(k,'PRISM / SYNCHRONOS',500,end+238,22,'#f1f0e9','center');text(k,'A PORTRAIT OF NOW.',500,end+280,19,'#a8b1ac','center');
  return canvas;
 }
 const menu=document.createElement('div');menu.className='export-format-menu';menu.id='exportFormatMenu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','PNG export format');
 menu.innerHTML='<button type="button" role="menuitem" data-export-format="graphic">GRAPHIC ONLY<small>Artwork without a caption</small></button><button type="button" role="menuitem" data-export-format="receipt">PORTRAIT RECEIPT<small>Title, graphics &amp; characteristics</small></button>';
 document.body.append(menu);let anchor=null,preparing=false;
 const trigger=()=>$('lab').classList.contains('portrait-view')?$('portraitSave'):$('nativeSave');
 function closeMenu(restoreFocus=false){menu.hidden=true;if(anchor){anchor.setAttribute('aria-expanded','false');if(restoreFocus&&anchor.isConnected)anchor.focus()}}
 function position(){
  if(menu.hidden||!anchor)return;const r=anchor.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight){closeMenu();return}
  const width=Math.min(Math.max(r.width,242),320,innerWidth-24);menu.style.width=width+'px';
  const h=menu.getBoundingClientRect().height;menu.style.left=Math.max(12,Math.min(innerWidth-width-12,r.left))+'px';
  menu.style.top=(r.top-h-9>=8?r.top-h-9:Math.min(innerHeight-h-8,r.bottom+9))+'px';
 }
 function toggleMenu(button){
  if(preparing||!button)return;if(!menu.hidden&&anchor===button){closeMenu(true);return}
  closeMenu();anchor=button;anchor.setAttribute('aria-haspopup','menu');anchor.setAttribute('aria-controls',menu.id);anchor.setAttribute('aria-expanded','true');
  menu.hidden=false;position();menu.querySelector('button').focus();
 }
 async function createExport(format){
  if(preparing)return;const snapshot=window.nativeExportSnapshot?.(format);if(!snapshot)return;
  const button=anchor||trigger(),label=button?.innerHTML;closeMenu();preparing=true;
  if(button){button.disabled=true;button.textContent='PREPARING PNG…'}
  try{
   await window.ensureNativeReady(snapshot);
   if(format==='receipt')await document.fonts.load('400 30px "Synchronos Typewriter"');
   const metadata=describe(snapshot),canvas=format==='receipt'?receipt(snapshot,metadata):graphic(snapshot);
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG could not be created.')),'image/png'));
   exportBlob=blob;if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(blob);
   const filename='synchronos-'+metadata.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+format+'.png';
   $('exportDialog').dataset.format=format;$('exportPreview').src=exportURL;$('exportPreview').alt=metadata.title+(format==='receipt'?' — portrait receipt':' — graphic only');
   $('downloadExport').href=exportURL;$('downloadExport').download=filename;
   const file=new File([blob],filename,{type:'image/png'});$('shareExport').hidden=!navigator.canShare?.({files:[file]});
   $('exportDialog').querySelector('.dialog-bar span').textContent=format==='receipt'?'PORTRAIT RECEIPT / PNG':'GRAPHIC ONLY / PNG';
   $('exportDialog').showModal();
  }catch(error){console.error('PNG export failed:',error);alert('The PNG could not be prepared. Please try saving again.');}
  finally{preparing=false;if(button){button.disabled=false;button.innerHTML=label}}
 }
 $('save').onclick=()=>toggleMenu(trigger());
 menu.addEventListener('click',event=>{const option=event.target.closest('[data-export-format]');if(option)createExport(option.dataset.exportFormat)});
 menu.addEventListener('keydown',event=>{
  const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
  if(event.key==='Escape'){event.preventDefault();closeMenu(true)}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus()}
 });
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!anchor?.contains(event.target))closeMenu()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden)closeMenu(true)});
 addEventListener('scroll',position,true);addEventListener('resize',position);addEventListener('viewchange',()=>closeMenu());
 $('exportDialog').addEventListener('close',()=>{if(anchor?.isConnected)anchor.focus()});
 $('shareExport').onclick=async()=>{try{await navigator.share({files:[new File([exportBlob],$('downloadExport').download,{type:'image/png'})]})}catch{}};
 // Keep metadata generation pure so identical artwork can be named consistently.
 window.describePortraitExport=describe;
})();
