/* Render original PDF pages at the displayed size; the turn animation uses the same URLs. */
import {getDocument,GlobalWorkerOptions} from './assets/vendor/pdfjs/pdf.mjs';
GlobalWorkerOptions.workerSrc=new URL('./assets/vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
const archive=document.getElementById('archive'),edition=document.getElementById('bookEdition'),book=document.getElementById('book');
const cache=new Map(),pending=new Map(),queue=[];let documentPromise,working=false,frame=0,reported=false;
const visible=()=>!archive.hidden&&!edition.hidden;
function widthNeeded(){return Math.ceil(Math.min(1800,Math.max(900,book.getBoundingClientRect().width/2*Math.min(devicePixelRatio||1,3)*1.5)))}
function touch(n,entry){cache.delete(n);cache.set(n,entry);return entry}
function trim(){if(book.classList.contains('is-turning'))return;const protectedPages=[...book.querySelectorAll('img[data-pdf-page]')].map(e=>Number(e.dataset.pdfPage));for(const [n,e] of cache){if(cache.size<=12)break;if(protectedPages.includes(n))continue;cache.delete(n);URL.revokeObjectURL(e.url)}}
function originalDocument(){return documentPromise??=getDocument({url:new URL('./assets/synchronos-source.pdf',import.meta.url).href}).promise.catch(error=>{documentPromise=undefined;throw error})}
async function pump(){
 if(working)return;working=true;
 while(queue.length){const job=queue.shift();let canvas;
  try{
   const pdf=await originalDocument(),page=await pdf.getPage(job.n),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:job.width/base.width});
   canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('The PDF page could not be rendered.');
   const existing=cache.get(job.n);
   if(existing&&existing.width>job.width){job.resolve(existing)}else{const entry={url:URL.createObjectURL(blob),width:job.width};if(existing)setTimeout(()=>URL.revokeObjectURL(existing.url),30000);touch(job.n,entry);job.resolve(entry)}
   page.cleanup();trim();
  }catch(error){job.reject(error)}finally{pending.delete(job.key);if(canvas){canvas.width=canvas.height=1}}
 }
 working=false;
}
function renderPage(n){
 const width=widthNeeded(),cached=cache.get(n);if(cached&&cached.width>=width)return Promise.resolve(touch(n,cached));
 const key=n+'@'+width;if(pending.has(key))return pending.get(key);
 const task=new Promise((resolve,reject)=>queue.push({n,width,key,resolve,reject}));pending.set(key,task);pump();return task;
}
function report(error){if(!reported){console.error('Original book PDF could not load:',error);reported=true}}
window.bookPageURL=n=>{const cached=cache.get(n);return cached?touch(n,cached).url:null};
window.requestBookPage=async(n,image)=>{
 if(!visible())return;
 try{const entry=await renderPage(n);if(image.dataset.pdfPage===String(n)){image.src=entry.url;image.dataset.renderSource='pdf';image.decoding='async'}}catch(error){report(error)}
};
window.prepareBookPages=async numbers=>{if(!visible())return;await Promise.all(numbers.map(n=>renderPage(n).catch(error=>report(error))))};
function refresh(){
 if(!visible())return;const images=[...book.querySelectorAll('img[data-pdf-page]')].filter(e=>e.dataset.pdfPage),pages=images.map(e=>Number(e.dataset.pdfPage));
 Promise.all(images.map(e=>window.requestBookPage(Number(e.dataset.pdfPage),e))).then(()=>{
  if(!visible()||images.some(e=>!pages.includes(Number(e.dataset.pdfPage))))return;
  const low=Math.min(...pages),high=Math.max(...pages),nearby=[low-2,low-1,high+1,high+2].filter(n=>n>=1&&n<=40&&!pages.includes(n));
  for(const n of nearby)renderPage(n).catch(error=>report(error));
 });
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh)}
new ResizeObserver(schedule).observe(book);
const visibilityObserver=new MutationObserver(schedule);for(const target of [archive,edition])visibilityObserver.observe(target,{attributes:true,attributeFilter:['hidden']});
addEventListener('bookspreadchange',schedule);addEventListener('resize',schedule);schedule();
