/* A damped paper spring: pointer displacement bends it; release speed carries it. */
(()=>{
 const book=$('book'),leaf=$('flipLeaf');let motion=null,grab=null,ignoreClickUntil=0,queued=0;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 // 클릭: 천천히 들리고(가속) → 중간에 가볍게 흐르고 → 종이가 내려앉듯 감속하는 곡선
 const softEase=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  // 드래그 후 놓았을 때: 이미 움직이는 중이므로 급가속 없이 부드럽게 안착
  settleEase=t=>1-Math.pow(1-t,2.4);
 function prepare(direction){
  if(busy||spread+direction<0||spread+direction>20)return null;
  book.dataset.turnStart=performance.now();busy=true;book.setAttribute('aria-busy','true');const original=spread,old=spreadPages(spread),next=spreadPages(spread+direction);

  const front=direction>0?old[1]:old[0],back=direction>0?next[0]:next[1],width=book.getBoundingClientRect().width/2,segments=24,step=width/segments;
  const textures=new Map([...old,...next].filter(Boolean).map(n=>[n,pageURL(n)]));
  paintImage('leftPage',direction>0?old[0]:next[0]);paintImage('rightPage',direction>0?next[1]:old[1]);
  leaf.replaceChildren();leaf.className='flip-leaf curled';leaf.hidden=false;book.classList.add('is-turning');
  const strips=[];
  for(let i=0;i<segments;i++){
   const strip=document.createElement('div');strip.className='paper-strip';strip.style.width=(step+.8)+'px';strip.style.setProperty('--strip-pitch',step+'px');
   const f=document.createElement('div'),b=document.createElement('div');f.className='strip-face strip-front';b.className='strip-face strip-back';
   const fi=direction>0?i:segments-1-i,bi=segments-1-fi;
   for(const [face,n,index]of [[f,front,fi],[b,back,bi]]){if(n){face.style.backgroundImage=`url("${textures.get(n)}")`;face.style.backgroundSize=(width+1.6)+'px 100%';face.style.backgroundPosition=(-index*step-.8)+'px 0';face.style.setProperty('--paper-width',width+'px');face.style.setProperty('--paper-position',(-index*step)+'px 0')}else face.style.visibility='hidden'}
   strip.append(f,b);leaf.append(strip);strips.push(strip);
  }
  const shadow=document.createElement('div');shadow.className='page-cast-shadow';shadow.style.left=direction>0?'50%':'0';book.append(shadow);
  motion={direction,original,width,segments,step,strips,shadow,p:0,v:0,target:0,held:false,vertical:0,stress:0,last:0,frame:0,releasedAt:0,releaseP:0,duration:1150,soft:false};
  paint(motion,0);return motion;
 }
 function paint(m,p){const bend=Math.sin(Math.PI*p),curl=bend*(.85+Math.min(.22,Math.abs(m.v)*.035));let x=0,z=0;
  m.strips.forEach((strip,i)=>{const u=(i+.5)/m.segments,angle=-m.direction*(Math.PI*p+curl*(u-.38)),nx=x+m.direction*m.step*Math.cos(angle),nz=z-m.direction*m.step*Math.sin(angle);
   const edge=i/m.segments,taper=edge*edge;const y=taper*(Math.sin(Math.PI*edge)*bend*m.vertical*m.width*.035+Math.sin(edge*Math.PI*3)*bend*Math.min(1,m.stress)*1.1);
   const nextU=(i+1)/m.segments,nextY=nextU*nextU*(Math.sin(Math.PI*nextU)*bend*m.vertical*m.width*.035+Math.sin(nextU*Math.PI*3)*bend*Math.min(1,m.stress)*1.1);
   const xx=m.direction>0?x:nx,zz=m.direction>0?z:nz,yy=m.direction>0?y:nextY,slope=m.direction>0?nextY-y:y-nextY;
   strip.style.transform=`translate3d(${xx}px,${yy}px,${zz}px) rotateY(${angle}rad) skewY(${Math.atan2(slope,m.step)}rad)`;
   strip.style.setProperty('--shade',String(bend*(.018+.04*u)));x=nx;z=nz;
  });m.shadow.style.opacity=String(bend*.24);$('book').style.setProperty('--spine-shadow',String(.10+bend*.025));
 }
 function finish(m,commit){cancelAnimationFrame(m.frame);spread=m.original+(commit?m.direction:0);leaf.hidden=true;leaf.replaceChildren();leaf.className='flip-leaf';m.shadow.remove();book.classList.remove('is-turning');book.style.removeProperty('--spine-shadow');book.dataset.turnMs=Math.round(performance.now()-Number(book.dataset.turnStart));motion=null;busy=false;book.setAttribute('aria-busy','false');updateBook();if(queued){const next=Math.sign(queued);queued-=next;queueMicrotask(()=>turn(next,true))}}
 function tick(now){const m=motion;if(!m)return;const dt=m.last?Math.min(.05,(now-m.last)/1000):1/60;m.last=now;
  if(m.held){m.v+=(72*(m.target-m.p)-17*m.v)*dt;m.p+=m.v*dt;paint(m,clamp(m.p,0,1))}
  else{if(!m.releasedAt){m.releasedAt=now;m.releaseP=m.p}const span=Math.abs(m.target-m.releaseP),dur=m.duration*(.35+.65*span),t=clamp((now-m.releasedAt)/dur,0,1),ease=m.soft?softEase(t):settleEase(t),prev=m.p;m.p=m.releaseP+(m.target-m.releaseP)*ease;m.v=(m.p-prev)/Math.max(dt,.001)*.35;paint(m,clamp(m.p,0,1));if(t===1){finish(m,m.target===1);return}}
  m.stress*=.96;m.frame=requestAnimationFrame(tick);
 }
 function run(m){if(!m.frame)m.frame=requestAnimationFrame(tick)}
 turn=(direction,chained)=>{if(performance.now()<ignoreClickUntil)return;if(busy){queued=clamp(queued+direction,-2,2);return}const m=prepare(direction);if(!m){queued=0;return}if(reduced){finish(m,true);return}m.target=1;m.v=0;m.soft=true;m.duration=chained?760:1150;run(m)};
 $('prev').onclick=$('cornerPrev').onclick=()=>turn(-1);$('next').onclick=$('cornerNext').onclick=()=>turn(1);
 function startDrag(g){const m=prepare(g.direction);if(!m)return;g.motion=m;m.held=true;m.vertical=g.vertical;moveDrag(g);if(g.released)release(g);run(m)}
 function moveDrag(g){const m=g.motion;if(!m)return;const distance=(g.startX-g.x)*g.direction;m.target=clamp(distance/(m.width*1.65),0,1);m.vertical=g.vertical;m.stress=Math.min(1,Math.abs(g.velocity)*.0008)}
 function release(g){const m=g.motion;if(!m)return;m.held=false;const speed=-g.velocity*g.direction/(m.width*1.65),projected=m.target+speed*.14;m.target=g.cancelled?0:projected>.34?1:0;m.v=clamp(m.v+speed*.45,-2,3);m.releasedAt=0;m.soft=false;m.duration=clamp(980-Math.abs(speed)*140,640,980);if(reduced){finish(m,m.target===1);return}run(m)}
 book.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;const r=book.getBoundingClientRect(),direction=e.clientX>r.left+r.width/2?1:-1;if(spread+direction<0||spread+direction>20)return;grab={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,lastX:e.clientX,lastTime:performance.now(),velocity:0,vertical:(e.clientY-r.top)/r.height-.5,direction,moved:false,released:false};});
 book.addEventListener('pointermove',e=>{const g=grab;if(!g||g.pointer!==e.pointerId)return;const now=performance.now(),dt=Math.max(8,now-g.lastTime);g.velocity=g.velocity*.4+(e.clientX-g.lastX)/dt*1000*.6;g.lastX=e.clientX;g.lastTime=now;g.x=e.clientX;const r=book.getBoundingClientRect();g.vertical=clamp((e.clientY-r.top)/r.height-.5,-.7,.7);if(!g.moved&&Math.abs(g.x-g.startX)>5){g.moved=true;book.setPointerCapture(e.pointerId);startDrag(g)}if(g.moved){e.preventDefault();moveDrag(g)}});
 function end(e,cancel=false){const g=grab;if(!g||g.pointer!==e.pointerId)return;grab=null;if(!g.moved)return;g.released=true;ignoreClickUntil=performance.now()+450;if(performance.now()-g.lastTime>100)g.velocity=0;if(cancel){g.cancelled=true;g.velocity=0;if(g.motion)g.motion.target=0}release(g)}
 window.cancelBookTurn=()=>{queued=0;grab=null;if(motion)finish(motion,false)};
 book.addEventListener('pointerup',e=>end(e));book.addEventListener('pointercancel',e=>end(e,true));book.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
