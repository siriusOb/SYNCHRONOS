/* Native AI paths stay vector from the source artboards through rendering. */
(()=>{
 const lab=$('lab'),workspace=lab.querySelector('.lab-workspace'),sourcebar=lab.querySelector('.lab-source-bar'),old=$('controls');
 sourcebar.hidden=true;old.hidden=true;lab.querySelector('.lab-signoff').hidden=true;lab.querySelector('.lab-footnote').hidden=true;
 const tabs=document.createElement('nav');tabs.className='portrait-tabs';tabs.setAttribute('aria-label','Portrait mode');tabs.innerHTML='<button type="button" id="quizTab">SELF-PORTRAIT</button><button type="button" id="studioTab">VARIANT</button>';lab.querySelector('.lab-heading').append(tabs);
 const quiz=document.createElement('section');quiz.className='portrait-quiz native-quiz';workspace.before(quiz);
 const result=document.createElement('section');result.className='portrait-result';result.hidden=true;workspace.before(result);
 const panel=document.createElement('aside');panel.className='native-controls';workspace.append(panel);
 const variantAction=document.createElement('div');variantAction.className='portrait-variant-action';variantAction.innerHTML='<button type="button" id="portraitVariant" class="solid"><span>PORTRAIT VARIANT</span><span aria-hidden="true">↗</span></button>';const viewer=workspace.querySelector('.lab-viewer'),canvasFooter=document.createElement('div');canvasFooter.className='portrait-canvas-footer';canvasFooter.append(viewer.querySelectorAll('.stage-meta')[1],variantAction);const resultControlDock=document.createElement('div');resultControlDock.className='portrait-control-dock';viewer.append(resultControlDock,canvasFooter);
 const names={1:'OVERSTIMULATION',2:'MALFUNCTION',3:'PARALYSIS',4:'ATTRITION',5:'COMPULSION',11:'SURVIVOR',12:'ORGANIZER / KING',13:'ORGANIZER / SUBJECT',14:'INVENTOR / MASTER',15:'INVENTOR / OPERATIVE',16:'COMMUNICATER',17:'HOMO SYNCHRONOS'};
 const questions=[
 ['How does information reach you today?',['One clear channel','Several open tabs','A continuous stream']],
 ['When something catches your eye, you tend to…',['Stay with it','Return to it later','Follow the next connection']],
 ['Which rhythm feels closest right now?',['Space between moments','A repeating rhythm','An uneven, shifting pace']],
 ['Where would you place yourself in a connected world?',['Near the edge','Inside a small circle','Among many intersections']],
 ['What kind of trace would you leave?',['A fine line','A quiet shape','An overlapping echo']],
 ['What would you carry into tomorrow?',['A little space','A familiar rhythm','An unexpected connection']]
 ];
 let vectors=[],step=0,answers=[],choices=[],done=false,mode='quiz',portrait=false,patternSeed=1,patternOverlap=55,quizImagesReady=false;
 let creatingTimer;
 const quizImages=[];
 const quizStarted=performance.now();
 function syncBeginPortrait(){const b=$('beginPortrait');if(!b)return;const ready=true;b.disabled=!ready;b.textContent='BEGIN';lab.dataset.quizReadyMs=Math.round(performance.now()-quizStarted)}
 const parchment=new Image();parchment.src='assets/previews/question-parchment.webp';parchment.decode().catch(()=>{});
 Promise.all(Array.from({length:10},(_,i)=>{const im=new Image();im.src=`assets/previews/graphic-${String(i+1).padStart(2,'0')}.webp?v=63`;quizImages.push(im);return im.decode().catch(()=>{})})).then(()=>{quizImagesReady=true;syncBeginPortrait()});
 const state={source:17,front:'#ec008c',back:'#00aeef',frontStyle:'line',backStyle:'fill',offset:18,scale:100,copies:1};
 const rand=n=>Math.floor(Math.random()*n),family=n=>n<=10?(n-1)%5+1:n;
 function makeChoices(){const counts={};answers.forEach(a=>counts[family(a.id)]=(counts[family(a.id)]||0)+1);let pool=[1,2,3,4,5].filter(n=>(counts[n]||0)<2);pool.sort(()=>Math.random()-.5);return pool.slice(0,3).map(n=>{const previous=answers.find(a=>family(a.id)===n);return previous?(previous.id<=5?n+5:n):n+(rand(2)?5:0)})}
 function updateTabs(){lab.querySelector('.lab-heading h1').textContent=mode==='quiz'?'SELF-PORTRAIT':'VARIANT';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String((b.id==='quizTab')===(mode==='quiz'))))}
 function showQuiz(){mode='quiz';workspace.hidden=true;result.hidden=true;quiz.hidden=false;updateTabs();if(done)showResult();else{lab.classList.remove('portrait-view');if(answers.length||step)question();else intro()}}
 function showStudio(source){clearTimeout(creatingTimer);quiz.classList.remove('is-creating');if(done)editor.setPortrait(resultPattern(),JSON.stringify([answers.map(a=>a.id),patternSeed,patternOverlap,state.scale,dx,dy]),[1400,900]);portrait=false;mode='studio';quiz.hidden=true;result.hidden=true;workspace.hidden=false;panel.hidden=false;lab.classList.remove('portrait-view');updateTabs();editor.enter(source!==undefined?source:done?'portrait':undefined);draw()}
 $('quizTab').onclick=showQuiz;$('studioTab').onclick=()=>showStudio();
 function reset(){clearTimeout(creatingTimer);quiz.classList.remove('is-creating');step=0;answers=[];choices=[];done=false;portrait=false;window.portraitRecord=null;showQuiz()}
 function intro(){quiz.innerHTML='<div class="quiz-art intro-art"><img src="assets/previews/graphic-17.webp?v=63" alt="Original Homo Synchronos artwork"></div><div class="quiz-intro"><span class="eyebrow">FIELD NOTE / YOU, TODAY</span><h2>What form does<br>your present take?</h2><p>Six small observations. Collect original graphic forms and arrange their sizes, spacing and overlaps into a personal pattern.</p><p class="hand-note">a passing observation, not a fixed identity.</p><button id="beginPortrait" class="solid" disabled>LOADING ORIGINAL FORMS…</button></div>';syncBeginPortrait();$('beginPortrait').onclick=()=>{choices=makeChoices();question()}}
 function question(){const questionIndex=step;if(!choices.length)choices=makeChoices();quiz.innerHTML=`<div class="quiz-progress"><span>OBSERVATION ${String(step+1).padStart(2,'0')} / 06</span><span>${answers.length} TRACES COLLECTED</span></div><div class="quiz-track"><i style="width:${step/6*100}%"></i></div><div class="collected-traces">${answers.map(a=>`<img src="assets/previews/graphic-${String(a.id).padStart(2,'0')}.webp?v=63" alt="Selected graphic, artboard ${a.id}">`).join('')}</div><h2>${questions[step][0]}</h2><div class="quiz-choices"></div><div class="quiz-actions"><button id="portraitBack">← ${step?'PREVIOUS OBSERVATION':'INTRO'}</button><small>choose a trace. the next observation follows.</small></div>`;
 {const ids=[...choices];(window.requestIdleCallback||(f=>setTimeout(f,300)))(()=>ids.forEach(id=>ensureVector(id).catch(()=>{})))}
 questions[step][1].forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.className='trace-choice';b.innerHTML=`<span class="stamp-visual" aria-hidden="true"><img class="stamp-ink" src="assets/previews/graphic-${String(choices[i]).padStart(2,'0')}.webp?v=63" alt="" decoding="sync"></span><span class="choice-number">0${i+1}</span><strong></strong><span class="choice-arrow">↗</span>`;b.querySelector('strong').textContent=text;b.onclick=()=>{if(step!==questionIndex||done)return;b.disabled=true;const chosen=choices[i];ensureVector(chosen).catch(()=>{});answers.push({id:chosen,choice:i,text});step++;choices=[];if(step===6){done=true;portrait=true;patternSeed=rand(0x7fffffff);patternOverlap=55;window.portraitRecord={title:['The lingering signal','The returning trace','The branching current'][answers[1].choice]};createPortrait()}else question()};quiz.querySelector('.quiz-choices').append(b)});
 $('portraitBack').onclick=()=>{if(step){step--;answers.pop();choices=[];question()}else intro()};
 }
 function createPortrait(){
  quiz.classList.add('is-creating');quiz.innerHTML=`<div class="portrait-creating" role="status" aria-live="polite"><div class="creating-traces" aria-hidden="true">${answers.map((a,i)=>`<img src="assets/previews/graphic-${String(a.id).padStart(2,'0')}.webp?v=63" alt="" style="--trace-delay:${i*.18}s">`).join('')}</div><h2>creating your portrait . . .</h2></div>`;
  clearTimeout(creatingTimer);
  // Assets are ready before BEGIN; visual timing cannot block the result.
  const revealDuration=reduced?0:(answers.length-1)*180+320;
  creatingTimer=setTimeout(showResult,revealDuration+1000);
 }
 function showResult(){clearTimeout(creatingTimer);quiz.classList.remove('is-creating');quiz.hidden=true;result.hidden=false;workspace.hidden=false;panel.hidden=true;portrait=true;lab.classList.add('portrait-view');result.innerHTML='<div class="portrait-identity"><div class="portrait-name-block"><span class="portrait-name-label">YOUR PORTRAIT</span><h2 class="portrait-name" id="portraitName"></h2><p class="portrait-description">6 traces collected.<br>A portrait of now.</p></div><div class="portrait-primary-action-slot"></div></div><div class="portrait-result-controls" role="group" aria-label="Pattern adjustments"><div class="portrait-tools"><button id="portraitSave">SAVE PORTRAIT <span aria-hidden="true">↗</span></button><button id="portraitRetake">TEST AGAIN <span aria-hidden="true">↻</span></button></div></div>';resultControlDock.replaceChildren();const resultTools=result.querySelector('.portrait-result-controls');canvasFooter.append(variantAction);workspace.querySelector('.portrait-name-block')?.remove();workspace.prepend(result.querySelector('.portrait-name-block'));workspace.querySelector('.portrait-name-block').append(resultTools);$('portraitName').textContent=window.portraitRecord.title;$('portraitVariant').onclick=()=>showStudio('portrait');$('portraitSave').onclick=()=>$('save').click();$('portraitRetake').onclick=reset;draw()}
 const editor=window.createVariantEditor({panel,names,getVectors:()=>vectors,redraw:()=>draw()});
 function resultPattern(){const elements=[],s=state.scale/100;
 {
  // Reset this generator for every draw so preview and downloads share a recipe.
  let seed=patternSeed>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const sites=[[-.39,-.24],[-.03,-.26],[.36,-.17],[-.28,.25],[.06,.20],[.39,.28]],sizes=[530,280,450,220,390,330];
  for(let j=sizes.length-1;j>0;j--){const q=Math.floor(random()*(j+1));[sizes[j],sizes[q]]=[sizes[q],sizes[j]]}
  const density=patternOverlap/100,spread=1.04-density*.69,phase=(random()-.5)*.55;
  answers.forEach((a,i)=>{const [u,v]=sites[i],jitterX=(random()-.5)*150,jitterY=(random()-.5)*100,px=u*1150*spread+jitterX,py=v*850*spread+jitterY,size=Math.min(540,sizes[i]*(.88+random()*.24)*(.9+density*.2)),angle=(random()-.5)*.8,radius=size*.66;
   const x=Math.max(40+radius,Math.min(1360-radius,700+px*Math.cos(phase)-py*Math.sin(phase))),y=Math.max(40+radius,Math.min(860-radius,450+px*Math.sin(phase)+py*Math.cos(phase)));
   elements.push({id:a.id,x:700+(x-700)*s+dx,y:450+(y-450)*s+dy,size:size*s,colour:i%2?state.front:state.back,style:'native',alpha:.96,minStroke:.72,angle});
  });
 }
 return elements}
 function plan(){return portrait?resultPattern():editor.plan()}
 function fit(g,size){return size/Math.max(g.width,g.height)}
 window.nativeExportSnapshot=()=>{
  const model=portrait?null:editor.exportState();
  return {origin:portrait||model.source==='portrait'?'portrait':'study',portraitTitle:window.portraitRecord?.title||null,
   dimensions:portrait?[1400,900]:editor.frame(),background:portrait?'#000000':'#080c0f',
   items:portrait?resultPattern().map(e=>({source:e.id,x:e.x,y:e.y,size:e.size,angle:e.angle||0,impressions:1,opacity:e.alpha})):model.objects,
   elements:plan().map(e=>({...e}))};
 };
 window.nativeExportName=()=>portrait?'synchronos-pattern':'synchronos-variant';
 window.nativeDimensions=()=>portrait?[1400,900]:editor.frame();
 window.renderNative=(k,w,h,transparent,snapshot)=>{if(!vectors.length)return false;k.clearRect(0,0,w,h);if(!transparent){k.fillStyle=snapshot?.background||(portrait?'#000000':'#080c0f');k.fillRect(0,0,w,h)}k.save();const dimensions=snapshot?.dimensions||(portrait?[1400,900]:editor.frame()),box=[0,0,...dimensions],zoom=Math.min(w/box[2],h/box[3]);k.translate((w-box[2]*zoom)/2-box[0]*zoom,(h-box[3]*zoom)/2-box[1]*zoom);k.scale(zoom,zoom);for(const e of (snapshot?.elements||plan())){const g=vectors[e.id-1],scale=fit(g,e.size);if(!g.ready){ensureVector(e.id).catch(()=>{});const im=preview(e.id,e.colour);if(im){k.save();k.globalAlpha=e.alpha;k.translate(e.x,e.y);k.rotate(e.angle||0);k.drawImage(im,-g.width*scale/2,-g.height*scale/2,g.width*scale,g.height*scale);k.restore()}continue;}k.save();k.globalAlpha=e.alpha;k.translate(e.x,e.y);k.rotate(e.angle||0);k.translate(-g.width*scale/2,g.height*scale/2);k.scale(scale,-scale);for(const p of g.paths){k.save();k.transform(...p.matrix);k.fillStyle=k.strokeStyle=e.colour;k.lineWidth=e.style==='line'?(p.kind==='line'?Math.min(p.width,.3):.55):Math.max(p.width,e.minStroke||0);k.lineJoin='round';if(e.style==='line')k.stroke(p.path);else if(p.kind==='fill'||e.style==='fill')k.fill(p.path,p.kind==='line'?'evenodd':'nonzero');else k.stroke(p.path);k.restore()}k.restore()}if(!snapshot&&!portrait&&k.canvas===c)editor.paintSelection(k);k.restore();if(!snapshot){$('labSourceName').textContent=portrait?'PERSONAL PATTERN / 6 COLLECTED TRACES':editor.label();$('liveParams').textContent=portrait?'6 COLLECTED TRACES':editor.status()}return true};
 window.nativeWheel=e=>{if(mode==='studio'){editor.wheel(e);return}state.scale=Math.max(40,Math.min(180,state.scale-Math.sign(e.deltaY)*5));draw()};
 window.nativePointerDown=e=>{if(mode!=='studio')return false;editor.pointerDown(e);return true};
 window.nativePointerMove=e=>{if(mode!=='studio')return false;editor.pointerMove(e);return true};
 window.nativePointerUp=e=>{if(mode!=='studio')return false;editor.pointerUp(e);return true};
 window.openNativeSource=n=>{const mapping={1:2,2:1,7:3,8:4,10:5,3:14,4:11,5:12,6:13,9:17,11:17,12:17};showStudio(mapping[n]||17)};
 // The quiz never waits for vector downloads. Load only sources actually used.
 const sourceMeta=[{"width":168.888,"height":163.215},{"width":175.924,"height":171.629},{"width":192.401,"height":200.722},{"width":130.909,"height":205.792},{"width":194.902,"height":194.483},{"width":210.543,"height":141.608},{"width":192.159,"height":187.474},{"width":212.286,"height":211.842},{"width":136.669,"height":206.755},{"width":249.029,"height":248.635},{"width":223.724,"height":298.237},{"width":228.973,"height":340.954},{"width":240.098,"height":280.773},{"width":96.1016,"height":328.337},{"width":160.733,"height":285.105},{"width":656.02,"height":294.772},{"width":82.8022,"height":300.092}];
 vectors=sourceMeta.map(g=>({...g,paths:[]}));
 const vectorTasks=new Map(),previewImages=new Map(),tintedPreviews=new Map();
 function ensureVector(id){
  if(vectors[id-1]?.ready)return Promise.resolve(vectors[id-1]);
  if(vectorTasks.has(id))return vectorTasks.get(id);
  lab.dataset.vectorRequests=String(vectorTasks.size+1);const task=fetch(`assets/vectors/graphic-${String(id).padStart(2,'0')}.json`).then(r=>{if(!r.ok)throw Error('Original graphic '+id+' unavailable');return r.json()}).then(g=>{
   for(const p of g.paths)p.path=new Path2D(p.d);
   g.ready=true;vectors[id-1]=g;lab.dataset.vectorsReady=String(vectors.filter(g=>g.ready).length);
   if(currentView==='lab'&&!workspace.hidden)draw();
   return g;
  }).catch(error=>{vectorTasks.delete(id);throw error});
  vectorTasks.set(id,task);return task;
 }
 function preview(id,colour){
  const key=id+colour;if(tintedPreviews.has(key))return tintedPreviews.get(key);
  let im=previewImages.get(id);
  if(!im){im=new Image();previewImages.set(id,im);im.onload=()=>{if(currentView==='lab'&&!workspace.hidden)draw()};im.src=`assets/previews/graphic-${String(id).padStart(2,'0')}.webp?v=63`}
  if(!im.complete||!im.naturalWidth)return null;
  const layer=document.createElement('canvas');layer.width=im.naturalWidth;layer.height=im.naturalHeight;
  const ink=layer.getContext('2d');ink.drawImage(im,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle=colour;ink.fillRect(0,0,layer.width,layer.height);
  if(tintedPreviews.size>32)tintedPreviews.clear();tintedPreviews.set(key,layer);return layer;
 }
 window.renderNativeStamp=(k,id,x,y,w,h)=>{
  const g=vectors[id-1];if(!g?.ready)return;
  const scale=Math.min(w/g.width,h/g.height);k.save();k.translate(x+w/2,y+h/2);k.translate(-g.width*scale/2,g.height*scale/2);k.scale(scale,-scale);
  for(const p of g.paths){k.save();k.transform(...p.matrix);k.fillStyle=k.strokeStyle='#a4adaa';k.lineWidth=Math.max(p.width,.72);k.lineJoin='round';if(p.kind==='fill')k.fill(p.path);else k.stroke(p.path);k.restore()}k.restore();
 };
 window.ensureNativeReady=snapshot=>Promise.all([...new Set((snapshot?.elements||plan()).map(e=>e.id))].map(ensureVector));
 showQuiz();
})();
