(()=>{
 const dialog=document.createElement('dialog');dialog.id='atlasEntry';dialog.className='atlas-entry';dialog.setAttribute('aria-labelledby','entryTitle');
 dialog.innerHTML='<div class="entry-top"><span>FIELD GUIDE / SYNCHRONOS</span><button id="entryClose">CLOSE ×</button></div><div class="entry-layout"><div class="entry-plate"><img id="entryImage" alt=""><div id="entryImageLabel"></div><div class="entry-actions"><button id="entryBook">READ IN THE BOOK ↗</button><button id="entryLab" class="solid">EXPERIMENT ↗</button></div></div><article class="entry-reading" tabindex="0" aria-label="Artwork description"><span id="entryCategory" class="eyebrow"></span><h2 id="entryTitle"></h2><p id="entrySubhead"></p><div id="entryBody"></div><div class="entry-source"><span id="entryBookLabel"></span><a href="assets/condition-notes-source.pdf" target="_blank" rel="noopener">ORIGINAL CONDITION NOTES ↗</a></div></article></div>';
 function fitEntry(){if(!dialog.open)return;const style=getComputedStyle(dialog),paddingX=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight),paddingY=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),width=dialog.clientWidth-paddingX,stacked=innerWidth<560,header=dialog.querySelector('.entry-top').getBoundingClientRect().height,caption=$('entryImageLabel').getBoundingClientRect().height,actions=dialog.querySelector('.entry-actions').getBoundingClientRect().height;const remaining=innerHeight*.9-paddingY-header-caption-actions-52,size=Math.floor(Math.min(stacked?width:Math.max(120,(width-28)*.43),stacked?remaining/2:remaining));dialog.style.setProperty('--entry-image-size',Math.max(100,size)+'px')}
 addEventListener('resize',fitEntry);new ResizeObserver(fitEntry).observe(dialog);
 document.body.append(dialog);$('entryClose').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 let notes=null,entryToken=0;const ready=fetch('assets/condition-notes.json?v=67-wording').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>notes=d).catch(()=>null);
 const pairs={1:['PANIC DISORDER','OCD'],2:['ADHD','SOCIAL ANXIETY'],7:['DEPRESSION','PTSD'],8:['BURNOUT','LONELINESS'],10:['FOMO','DOOMSCROLLING']};
 const categories={1:['MALFUNCTION','통제의 실패로 인한 신체의 오작동',24],2:['OVERSTIMULATION','정보의 홍수로 인한 과잉 자극',22],7:['PARALYSIS','외부의 압력으로 인한 지각 마비',26],8:['ATTRITION','사회 안에서의 점진적 마모로 인한 고갈',28],10:['COMPULSION','디지털 환경 내에서의 강박적 충동',30]};
 const human={3:['COMMUNICATOR',14],4:['SURVIVOR',8],5:['ORGANIZER',10],6:['INVENTOR',12]},speciesPages={9:34,11:32,12:1};
 function paragraph(text,cls){const p=document.createElement('p');p.className=cls||'';p.textContent=text;return p}
 window.openAtlasEntry=async n=>{
 const token=++entryToken;
  const group=categories[n],h=human[n],bookPage=group?.[2]||h?.[1]||speciesPages[n]||1;
  $('entryImage').src=thumbAsset(n);const originalImage=new Image();originalImage.src=asset(n);originalImage.decode().then(()=>{if(token===entryToken&&dialog.open)$('entryImage').src=originalImage.src}).catch(()=>{});$('entryImage').alt=`Original postcard ${n}`;$('entryImageLabel').textContent=`POSTCARD ${String(n).padStart(2,'0')} / ORIGINAL AI ARTWORK`;
  $('entryCategory').textContent=group?`CHAPTER 02 / ${[1,2,7].includes(n)?'CLINICAL CONDITIONS':'CONTEMPORARY PHENOMENA'}`:h?'CHAPTER 01 / HUMAN':n===12?'SYNCHRONOS / COVER':'CHAPTER 03 / SPECIES';
  $('entryTitle').textContent=group?.[0]||h?.[0]||cardNames[n-1];$('entrySubhead').textContent=group?.[1]||'Original text from the book';$('entryBody').replaceChildren();$('entryBookLabel').textContent=`BOOK / PDF ${bookPage}${group?'–'+(bookPage+1):''} OF 40`;
  $('entryBook').onclick=()=>{dialog.close();setEdition('book');jumpPage(bookPage);setView('archive')};$('entryLab').onclick=()=>{dialog.close();setCard(n);setView('lab')};
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.entry-reading').scrollTop=0;fitEntry();requestAnimationFrame(fitEntry);
  if(group){await ready;if(token!==entryToken)return;
   for(const name of pairs[n]){const r=notes?.[name],section=document.createElement('section');section.className='condition-record';const title=document.createElement('h3');title.textContent=r?`${r.title} / ${r.metaphor}`:name;section.append(title);if(r?.classification)section.append(paragraph('CLASSIFICATION / '+r.classification,'entry-meta'));if(r?.characteristic)section.append(paragraph('CORE CHARACTERISTIC / '+r.characteristic,'entry-meta'));section.append(paragraph(r?.text||'Open the original condition notes to read this record.','original-text'));$('entryBody').append(section)}
  }else{
   if(!pages.length){try{pages=await fetch('assets/pages.json').then(r=>r.json())}catch{}}if(token!==entryToken)return;
   const sourcePages=h?[bookPage,bookPage+1]:n===9?[34,35,36]:n===11?[32,33,34]:[1,3];
   for(const p of sourcePages){const text=pages[p-1]?.text.trim();if(text&&text.length>50){const section=document.createElement('section');section.className='condition-record';section.append(paragraph('BOOK / PDF PAGE '+p,'entry-meta'),paragraph(text,'original-text'));$('entryBody').append(section)}}
   if(!$('entryBody').children.length)$('entryBody').append(paragraph('SYNCHRONOS — A Contemporary Human Report.','original-text'));
  }
 };
})();
