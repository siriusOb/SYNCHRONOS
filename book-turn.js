/* SYNCHRONOS page turn
   The turning leaf is ONE continuous mesh drawn with WebGL (no strips, no seams, no gaps).
   - The spine edge stays pinned to the binding; the sheet bends smoothly from it.
   - Page textures are decoded off the main thread and uploaded ahead of time.
   - Motion is time-based; releasing a drag hands its velocity to the settle curve.
   If WebGL2 is unavailable the previous DOM version (book-turn-legacy.js) is used. */
(()=>{
 const book=$('book'),canvas=document.createElement('canvas');
 let gl=null;
 try{gl=canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:true,depth:true,powerPreference:'high-performance'})}catch{}
 if(!gl){const s=document.createElement('script');s.src='book-turn-legacy.js?v=responsive-62-gl';document.body.append(s);return}

 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const COLS=56,ROWS=14,PAPER=[298,300];
 let motion=null,grab=null,ignoreClickUntil=0,queued=0,lost=false,persp=1800;

 canvas.className='turn-canvas';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');book.append(canvas);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});

 /* ---------- shaders ---------- */
 const VS=`#version 300 es
 in vec3 aPos;in vec2 aUV;in vec3 aNor;
 uniform vec2 uBook;uniform float uD;
 out vec2 vUV;out vec3 vNor;
 void main(){
  float k=uD/(uD-aPos.z);
  float sx=uBook.x*.5+aPos.x*k;
  float sy=uBook.y*.5+(aPos.y-uBook.y*.5)*k;
  gl_Position=vec4(sx/uBook.x*2.-1.,1.-sy/uBook.y*2.,-aPos.z/(uD*2.),1.);
  vUV=aUV;vNor=aNor;
 }`;
 const FS=`#version 300 es
 precision highp float;
 in vec2 vUV;in vec3 vNor;
 uniform sampler2D uF,uB,uP;
 uniform float uDir,uHasF,uHasB,uShade,uGW;
 uniform vec2 uSize;
 out vec4 o;
 void main(){
  bool fr=gl_FrontFacing;if(uDir<0.)fr=!fr;
  float u=vUV.x,v=vUV.y;vec3 c;vec3 n=normalize(vNor);
  if(fr){if(uHasF<.5)discard;c=texture(uF,vec2(uDir>0.?u:1.-u,v),-.6).rgb;}
  else{if(uHasB<.5)discard;c=texture(uB,vec2(uDir>0.?1.-u:u,v),-.6).rgb;n=-n;}
  vec3 L=normalize(vec3(-.32,-.46,.83));
  float f=clamp(dot(n,L)/L.z,0.,1.);
  float light=1.-.24*(1.-f);
  float g=.105*max(0.,1.-u/uGW);
  light*=(1.-g)*(1.-.05*uShade*u);
  float paper=1.-.055*(1.-texture(uP,vec2(u*uSize.x,v*uSize.y)/vec2(${PAPER[0]}.,${PAPER[1]}.)).r);
  o=vec4(c*light*paper,1.);
 }`;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 const prog=gl.createProgram();
 try{gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog))}
 catch(e){console.warn('Page turn: WebGL shader failed, using DOM fallback',e);canvas.remove();const s=document.createElement('script');s.src='book-turn-legacy.js?v=responsive-62-gl';document.body.append(s);return}
 gl.useProgram(prog);
 const U={};for(const k of ['uBook','uD','uDir','uHasF','uHasB','uShade','uGW','uSize','uF','uB','uP'])U[k]=gl.getUniformLocation(prog,k);

 /* ---------- mesh ---------- */
 const NV=(COLS+1)*(ROWS+1),pos=new Float32Array(NV*3),nor=new Float32Array(NV*3),uv=new Float32Array(NV*2),idx=new Uint16Array(COLS*ROWS*6);
 for(let r=0,i=0;r<=ROWS;r++)for(let c=0;c<=COLS;c++,i++){uv[i*2]=c/COLS;uv[i*2+1]=r/ROWS}
 for(let r=0,k=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const a=r*(COLS+1)+c,b=a+1,d=a+COLS+1,e=d+1;idx.set([a,d,b,b,d,e],k);k+=6}
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 function attr(name,data,size,usage){const b=gl.createBuffer(),l=gl.getAttribLocation(prog,name);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,usage);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);return b}
 const posBuf=attr('aPos',pos,3,gl.DYNAMIC_DRAW),norBuf=attr('aNor',nor,3,gl.DYNAMIC_DRAW);attr('aUV',uv,2,gl.STATIC_DRAW);
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
 gl.uniform1i(U.uF,0);gl.uniform1i(U.uB,1);gl.uniform1i(U.uP,2);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);

 /* ---------- textures ---------- */
 const aniso=gl.getExtension('EXT_texture_filter_anisotropic');
 function makeTex(source,repeat){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const wrap=repeat?gl.REPEAT:gl.CLAMP_TO_EDGE;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap);
  if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return t;
 }
 let paperTex=makeTex(new ImageData(new Uint8ClampedArray([255,255,255,255]),1,1),true);
 {const im=new Image();im.onload=()=>{try{gl.deleteTexture(paperTex);paperTex=makeTex(im,true)}catch{}};im.src='assets/natural-paper.png'}

 const tex=new Map(),pending=new Map();let texSize=0;
 const wantSize=()=>Math.min(1400,Math.max(560,Math.ceil(book.clientWidth/2*Math.min(devicePixelRatio||1,2)*1.15)));
 async function fetchBitmap(n,size){
  const name=String(n).padStart(2,'0');
  for(const url of [`assets/book-pages/${name}.webp`,`assets/book-${name}.jpg`]){
   try{
    const r=await fetch(url);if(!r.ok)continue;const blob=await r.blob();
    try{return await createImageBitmap(blob,{resizeWidth:size,resizeQuality:'high'})}catch{}
    try{return await createImageBitmap(blob)}catch{}
    const im=new Image();im.src=URL.createObjectURL(blob);await im.decode();return im;
   }catch{}
  }
  throw Error('page '+n);
 }
 function getTex(n){
  if(!n)return Promise.resolve(null);
  if(tex.has(n))return Promise.resolve(tex.get(n));
  if(pending.has(n))return pending.get(n);
  const size=texSize||(texSize=wantSize());
  const p=fetchBitmap(n,size).then(src=>{const t=makeTex(src,false);src.close?.();tex.set(n,t);pending.delete(n);return t}).catch(e=>{pending.delete(n);throw e});
  pending.set(n,p);return p;
 }
 function wanted(){const s=new Set();for(const sp of [spread-1,spread,spread+1]){if(sp<0||sp>20)continue;for(const n of spreadPages(sp))if(n)s.add(n)}return s}
 let preloadTimer=0;
 function preload(){
  if(lost||busy)return;
  const need=wantSize();if(texSize&&need>texSize*1.3){for(const t of tex.values())gl.deleteTexture(t);tex.clear();texSize=need}
  const w=wanted();
  for(const [n,t] of tex)if(!w.has(n)){gl.deleteTexture(t);tex.delete(n)}
  for(const n of w)getTex(n).catch(()=>{});
 }
 function schedulePreload(){clearTimeout(preloadTimer);preloadTimer=setTimeout(()=>(window.requestIdleCallback||(f=>f()))(preload),60)}
 const baseUpdate=updateBook;updateBook=function(){const r=baseUpdate.apply(this,arguments);schedulePreload();return r};
 addEventListener('viewchange',schedulePreload);addEventListener('resize',schedulePreload);schedulePreload();

 /* ---------- geometry + drawing ---------- */
 function sizeCanvas(){
  const d=Math.min(devicePixelRatio||1,2),w=book.clientWidth,h=book.clientHeight,pw=Math.round(w*d),ph=Math.round(h*d);
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
  gl.viewport(0,0,pw,ph);persp=parseFloat(getComputedStyle(book).perspective)||1800;
 }
 function drawMesh(m,p){
  p=clamp(p,0,1);
  const W=m.W,H=m.H,dir=m.direction,step=W/COLS,bend=Math.sin(Math.PI*p),root=p*p*(3-2*p),vert=m.vertical;
  /* Spine edge lags while the sheet lifts and leads while it lands, so the binding side stays
     attached to the stack and the surface is a single smooth curve across its width. */
  for(let r=0;r<=ROWS;r++){
   const v=r/ROWS,tilt=bend*vert*(v-.5)*.5;let X=0,Z=0;
   const ang=u=>Math.PI*(root+(p-root)*u)+tilt*u;
   for(let c=0;c<=COLS;c++){
    const u=c/COLS,th=ang(u),i=(r*(COLS+1)+c)*3;
    pos[i]=X;pos[i+1]=v*H+bend*vert*W*.03*u*u;pos[i+2]=Z;
    nor[i]=-dir*Math.sin(th);nor[i+1]=0;nor[i+2]=Math.cos(th);
    if(c<COLS){const t=ang((c+.5)/COLS);X+=dir*step*Math.cos(t);Z+=step*Math.sin(t)}
   }
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,posBuf);gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);
  gl.bindBuffer(gl.ARRAY_BUFFER,norBuf);gl.bufferSubData(gl.ARRAY_BUFFER,0,nor);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.tf||paperTex);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,m.tb||paperTex);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,paperTex);
  gl.uniform2f(U.uBook,book.clientWidth,H);gl.uniform1f(U.uD,persp);gl.uniform1f(U.uDir,dir);
  gl.uniform1f(U.uHasF,m.tf?1:0);gl.uniform1f(U.uHasB,m.tb?1:0);gl.uniform1f(U.uShade,bend);gl.uniform1f(U.uGW,16/W);gl.uniform2f(U.uSize,W,H);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);
  if(m.shadow)m.shadow.style.opacity=String(bend*.22);
 }

 /* ---------- turn lifecycle ---------- */
 function prepare(direction){
  if(busy||lost||spread+direction<0||spread+direction>20)return null;
  const original=spread,old=spreadPages(spread),next=spreadPages(spread+direction);
  const front=direction>0?old[1]:old[0],back=direction>0?next[0]:next[1];
  busy=true;book.setAttribute('aria-busy','true');book.dataset.turnStart=performance.now();
  const m={direction,original,old,next,W:book.clientWidth/2,H:book.clientHeight,p:0,v:0,target:0,held:false,vertical:0,last:0,frame:0,releasedAt:0,ready:false,dead:false,T:1.1,from:0,v0:0,soft:true,shadow:null,tf:null,tb:null};
  motion=m;
  Promise.all([getTex(front),getTex(back)]).then(([tf,tb])=>begin(m,tf,tb)).catch(()=>{if(!m.dead)finish(m,false)});
  return m;
 }
 async function begin(m,tf,tb){
  if(m.dead)return;
  m.tf=tf;m.tb=tb;sizeCanvas();
  const sh=document.createElement('div');sh.className='page-cast-shadow';sh.style.left=m.direction>0?'50%':'0';if(m.direction<0)sh.style.transform='scaleX(-1)';book.append(sh);m.shadow=sh;
  drawMesh(m,0);canvas.hidden=false;book.classList.add('is-turning');
  /* swap the stationary pages only after the leaf already covers the old one */
  paintImage('leftPage',m.direction>0?m.old[0]:m.next[0]);paintImage('rightPage',m.direction>0?m.next[1]:m.old[1]);
  await Promise.all([$('leftPage'),$('rightPage')].map(i=>i.decode?.().catch(()=>{})));
  if(m.dead)return;
  m.ready=true;m.last=0;
  if(!m.frame)m.frame=requestAnimationFrame(tick);
 }
 function finish(m,commit){
  if(m.dead)return;m.dead=true;cancelAnimationFrame(m.frame);
  spread=m.original+(commit?m.direction:0);
  canvas.hidden=true;m.shadow?.remove();book.classList.remove('is-turning');
  book.dataset.turnMs=Math.round(performance.now()-Number(book.dataset.turnStart));
  if(motion===m)motion=null;busy=false;book.setAttribute('aria-busy','false');
  updateBook();
  if(queued){const n=Math.sign(queued);queued-=n;queueMicrotask(()=>turn(n,true))}
 }
 const hermite=(s,p0,m0,p1)=>{const s2=s*s,s3=s2*s;return(2*s3-3*s2+1)*p0+(s3-2*s2+s)*m0+(-2*s3+3*s2)*p1};
 function tick(now){
  const m=motion;if(!m||m.dead)return;
  m.frame=0;
  if(m.ready){
   const dt=m.last?Math.min(.05,(now-m.last)/1000):1/60;m.last=now;
   if(m.held){
    for(let i=0;i<2;i++){const h=dt/2;m.v+=(72*(m.target-m.p)-17*m.v)*h;m.p+=m.v*h}
    drawMesh(m,m.p);
   }else{
    if(!m.releasedAt){
     m.releasedAt=now;m.from=m.p;m.v0=m.v;
     const d=m.target-m.from;
     if(m.soft)m.v0=0;else{m.T=clamp(1.05*(.38+.62*Math.abs(d)),.4,1.05);if(Math.abs(m.v0)>.2)m.T=Math.max(.4,Math.min(m.T,1.7*Math.abs(d)/Math.abs(m.v0)))}
    }
    const d=m.target-m.from,s=clamp((now-m.releasedAt)/1000/m.T,0,1);
    let m0=m.v0*m.T;m0=d>0?clamp(m0,0,3*d):d<0?clamp(m0,3*d,0):0;
    m.p=hermite(s,m.from,m0,m.target);m.v=0;
    drawMesh(m,m.p);
    if(s===1){finish(m,m.target===1);return}
   }
  }
  m.frame=requestAnimationFrame(tick);
 }
 function run(m){if(!m.frame&&m.ready)m.frame=requestAnimationFrame(tick)}

 turn=(direction,chained)=>{
  if(performance.now()<ignoreClickUntil)return;
  if(busy){queued=clamp(queued+direction,-2,2);return}
  if(reduced||lost){if(spread+direction<0||spread+direction>20)return;spread+=direction;updateBook();return}
  const m=prepare(direction);if(!m){queued=0;return}
  m.target=1;m.soft=true;m.T=chained?.78:1.15;
 };
 $('prev').onclick=$('cornerPrev').onclick=()=>turn(-1);$('next').onclick=$('cornerNext').onclick=()=>turn(1);

 /* ---------- pointer drag ---------- */
 function startDrag(g){const m=prepare(g.direction);if(!m)return;g.motion=m;m.held=true;m.soft=false;m.vertical=g.vertical;moveDrag(g);if(g.released)release(g);run(m)}
 function moveDrag(g){const m=g.motion;if(!m)return;const distance=(g.startX-g.x)*g.direction;m.target=clamp(distance/(m.W*1.65),0,1);m.vertical=g.vertical}
 function release(g){
  const m=g.motion;if(!m||m.dead)return;
  const speed=-g.velocity*g.direction/(m.W*1.65),projected=m.target+speed*.14;
  m.held=false;m.target=g.cancelled?0:projected>.34?1:0;m.soft=false;m.releasedAt=0;m.v=clamp(m.v+speed*.35,-2.5,3);
  run(m);
 }
 book.addEventListener('pointerdown',e=>{if(busy||lost||e.button!==0)return;const r=book.getBoundingClientRect(),direction=e.clientX>r.left+r.width/2?1:-1;if(spread+direction<0||spread+direction>20)return;grab={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,lastX:e.clientX,lastTime:performance.now(),velocity:0,vertical:(e.clientY-r.top)/r.height-.5,direction,moved:false,released:false}});
 book.addEventListener('pointermove',e=>{const g=grab;if(!g||g.pointer!==e.pointerId)return;const now=performance.now(),dt=Math.max(8,now-g.lastTime);g.velocity=g.velocity*.4+(e.clientX-g.lastX)/dt*1000*.6;g.lastX=e.clientX;g.lastTime=now;g.x=e.clientX;const r=book.getBoundingClientRect();g.vertical=clamp((e.clientY-r.top)/r.height-.5,-.7,.7);if(!g.moved&&Math.abs(g.x-g.startX)>5){g.moved=true;book.setPointerCapture(e.pointerId);startDrag(g)}if(g.moved){e.preventDefault();moveDrag(g)}});
 function end(e,cancel=false){const g=grab;if(!g||g.pointer!==e.pointerId)return;grab=null;if(!g.moved)return;g.released=true;ignoreClickUntil=performance.now()+450;if(performance.now()-g.lastTime>100)g.velocity=0;if(cancel){g.cancelled=true;g.velocity=0;if(g.motion)g.motion.target=0}release(g)}
 window.cancelBookTurn=()=>{queued=0;grab=null;if(motion)finish(motion,false)};
 book.addEventListener('pointerup',e=>end(e));book.addEventListener('pointercancel',e=>end(e,true));
 book.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
