import {getDocument,GlobalWorkerOptions} from './assets/vendor/pdfjs/pdf.mjs';
GlobalWorkerOptions.workerSrc=new URL('./assets/vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
const host=document.querySelector('.poster-view'),sheet=host.querySelector('.poster-sheet'),canvas=document.getElementById('posterCanvas'),fallback=sheet.querySelector('img'),edition=document.getElementById('posterEdition');
const lens=document.createElement('div'),lensCanvas=document.createElement('canvas');lens.className='poster-lens';lens.hidden=true;lens.setAttribute('aria-hidden','true');lens.append(lensCanvas);host.append(lens);fallback.draggable=false;
let pagePromise,buffer,rendering=false,pending=false,scheduled=false,pointer=null;
const zoom=2.4;
function hide(){pointer=null;if(!lens.hidden)lens.hidden=true}
function paintLens(){
 scheduled=false;if(!pointer||!buffer||edition.hidden)return;
 const r=sheet.getBoundingClientRect(),h=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3);if(!r.width||!r.height)return;
 lens.hidden=false;const size=lens.getBoundingClientRect().width;
 const left=Math.max(0,Math.min(h.width-size,pointer.x-h.left-size/2)),top=Math.max(0,Math.min(h.height-size,pointer.y-h.top-size/2));
 lens.style.left=left+'px';lens.style.top=top+'px';
 const pixels=Math.round(size*dpr);if(lensCanvas.width!==pixels){lensCanvas.width=pixels;lensCanvas.height=pixels}
 const ctx=lensCanvas.getContext('2d'),x=pointer.x-r.left,y=pointer.y-r.top,centerX=pointer.x-h.left-left,centerY=pointer.y-h.top-top;
 ctx.clearRect(0,0,pixels,pixels);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // Sample the PDF rendering, never the low-resolution placeholder.
 ctx.drawImage(buffer,(centerX-x*zoom)*dpr,(centerY-y*zoom)*dpr,r.width*zoom*dpr,r.height*zoom*dpr);
}
function requestLens(){if(!scheduled){scheduled=true;requestAnimationFrame(paintLens)}}
async function renderPoster(){
 if(edition.hidden||document.getElementById('archive').hidden)return;
 if(rendering){pending=true;return}
 const rect=sheet.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
 const outputScale=Math.max(2,Math.min(devicePixelRatio||1,3))*zoom,targetWidth=Math.ceil(rect.width*outputScale);
 if(buffer&&Math.abs(buffer.width-targetWidth)<4)return;
 rendering=true;
 try{
  pagePromise??=getDocument({url:new URL('./assets/poster-source.pdf',import.meta.url).href}).promise.then(pdf=>pdf.getPage(1));
  const page=await pagePromise,base=page.getViewport({scale:1}),viewport=page.getViewport({scale:targetWidth/base.width});
  const next=document.createElement('canvas');next.width=Math.ceil(viewport.width);next.height=Math.ceil(viewport.height);
  await page.render({canvasContext:next.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
  buffer=next;canvas.width=next.width;canvas.height=next.height;canvas.getContext('2d').drawImage(next,0,0);canvas.hidden=false;fallback.hidden=true;sheet.dataset.pdfRendered='true';requestLens();
 }catch(error){console.error('Poster PDF rendering failed:',error);sheet.dataset.pdfRendered='false'}
 finally{rendering=false;if(pending){pending=false;requestAnimationFrame(renderPoster)}}
}
let resizeFrame;
function schedule(){hide();cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(renderPoster)}
new ResizeObserver(schedule).observe(sheet);
const visibilityObserver=new MutationObserver(schedule);for(const target of [edition,document.getElementById('archive')])visibilityObserver.observe(target,{attributes:true,attributeFilter:['hidden']});
sheet.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY};requestLens()});sheet.addEventListener('pointerleave',hide);sheet.addEventListener('pointercancel',hide);addEventListener('blur',hide);addEventListener('resize',schedule);schedule();
