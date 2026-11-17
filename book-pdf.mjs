/* Pages are rendered once from the original PDF at build time, losslessly.
   Reading/turning never downloads or rasterizes the full PDF on the UI thread. */
const book=document.getElementById('book'),archive=document.getElementById('archive'),edition=document.getElementById('bookEdition');
const ready=new Map(),tasks=new Map(),lowImages=new Map();let timer;
const visible=()=>!archive.hidden&&!edition.hidden;
const high=n=>`assets/book-pages/${String(n).padStart(2,'0')}.webp`;
function load(n){
 if(ready.has(n))return Promise.resolve(ready.get(n));if(tasks.has(n))return tasks.get(n);
 const task=new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=async()=>{try{await im.decode()}catch{}ready.set(n,im.src);resolve(im.src)};im.onerror=()=>{tasks.delete(n);reject(Error('Book page '+n+' unavailable'))};im.src=high(n)});tasks.set(n,task);return task;
}
window.bookPageURL=n=>ready.get(n)||null;
window.requestBookPage=async(n,image)=>{
 if(!visible())return;
 try{const url=await load(n);if(!book.classList.contains('is-turning')&&image.dataset.pdfPage===String(n)){image.src=url;image.dataset.renderSource='original-pdf-lossless'}}catch{}
};
function refresh(){
 if(!visible()||book.classList.contains('is-turning'))return;
 const images=[...book.querySelectorAll('.book-leaf img[data-pdf-page]')].filter(e=>e.dataset.pdfPage),pages=images.map(e=>+e.dataset.pdfPage);
 for(const image of images)window.requestBookPage(+image.dataset.pdfPage,image);
 if(!pages.length)return;
 for(const n of lowImages.keys())if(n<Math.min(...pages)-2||n>Math.max(...pages)+2)lowImages.delete(n);
 // Small immediate turn textures; high resolution is fetched for visible pages only.
 for(let n=Math.max(1,Math.min(...pages)-2);n<=Math.min(40,Math.max(...pages)+2);n++)if(!lowImages.has(n)){const im=new Image();im.src=`assets/book-${String(n).padStart(2,'0')}.jpg`;lowImages.set(n,im)}
}
function schedule(){clearTimeout(timer);timer=setTimeout(refresh,80)}
const observer=new MutationObserver(schedule);for(const target of [archive,edition])observer.observe(target,{attributes:true,attributeFilter:['hidden']});
addEventListener('bookspreadchange',schedule);addEventListener('viewchange',schedule);schedule();
