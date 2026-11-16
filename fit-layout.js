/* Measure actual UI space rather than relying on fixed laptop dimensions. */
(()=>{
 let pending=false;const root=document.documentElement;
 function fit(){pending=false;const header=document.querySelector('header'),main=document.querySelector('main'),view=[...document.querySelectorAll('.view')].find(v=>!v.hidden);if(!view)return;
  const hh=header.getBoundingClientRect().height;root.style.setProperty('--header-height',hh+'px');
  const top=view.getBoundingClientRect().top+window.scrollY,available=Math.max(280,innerHeight-top-54);root.style.setProperty('--view-height',available+'px');
  const reader=$('bookEdition').querySelector('.reader'),heading=$('archive').querySelector('.archive-heading');
  const activeEdition=!$('bookEdition').hidden?reader:!$('postcardsEdition').hidden?document.querySelector('.postcard-grid'):document.querySelector('.poster-view');const archiveTop=activeEdition.getBoundingClientRect().top+scrollY;const footerHeight=document.querySelector('footer').getBoundingClientRect().height;const archiveSpace=Math.max(220,!$('archive').hidden?innerHeight-archiveTop-footerHeight-parseFloat(getComputedStyle(main).paddingBottom)-4:innerHeight-hh-66-heading.getBoundingClientRect().height-16);root.style.setProperty('--reader-height',archiveSpace+'px');
  const atlas=$('atlas'),map=$('atlasMap');if(!atlas.hidden){const mapTop=map.getBoundingClientRect().top+scrollY;map.style.height=Math.max(220,innerHeight-mapTop-98)+'px'}
  const lab=$('lab');if(!lab.hidden){const h=lab.querySelector('.lab-heading').getBoundingClientRect().height,body=Math.max(330,available-h-14);root.style.setProperty('--portrait-height',body+'px');const result=lab.querySelector('.portrait-result');if(lab.classList.contains('portrait-view')&&!result.hidden){const resultStyle=getComputedStyle(result),resultSpace=result.getBoundingClientRect().height+parseFloat(resultStyle.marginBottom);root.style.setProperty('--result-workspace-height',Math.max(170,body-resultSpace)+'px')}}
  const canvas=$('canvas'),area=canvas.parentElement,areaBox=area.getBoundingClientRect();if(areaBox.width&&areaBox.height){const factor=Math.min(areaBox.width/canvas.width,areaBox.height/canvas.height);area.style.setProperty('--art-width',canvas.width*factor+'px');area.style.setProperty('--art-height',canvas.height*factor+'px');area.parentElement.style.setProperty('--art-width',canvas.width*factor+'px')}
  const poster=document.querySelector('.poster-view'),posterImage=poster.querySelector('img');if(!$('posterEdition').hidden&&!$('archive').hidden&&posterImage.naturalWidth){const style=getComputedStyle(poster),w=poster.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),h=poster.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom),scale=Math.min(w/posterImage.naturalWidth,h/posterImage.naturalHeight);poster.style.setProperty('--poster-width',Math.floor(posterImage.naturalWidth*scale)+'px');poster.style.setProperty('--poster-height',Math.floor(posterImage.naturalHeight*scale)+'px')}
  document.querySelectorAll('input[type=range]').forEach(syncRangeFill);
  const stage=$('book').parentElement;if(stage.clientHeight&&stage.clientWidth&&!busy){const size=Math.floor(Math.min(stage.getBoundingClientRect().height,stage.getBoundingClientRect().width));$('book').style.width=size+'px';$('book').style.height=size+'px'}
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(fit)}}
 new ResizeObserver(schedule).observe(document.querySelector('header'));
 new ResizeObserver(schedule).observe($('book').parentElement);
 new ResizeObserver(schedule).observe($('canvas').parentElement);
 new ResizeObserver(schedule).observe($('lab').querySelector('.portrait-result'));
 new ResizeObserver(schedule).observe($('lab').querySelector('.lab-heading'));
 new MutationObserver(schedule).observe($('canvas'),{attributes:true,attributeFilter:['width','height']});
 new MutationObserver(schedule).observe(document.querySelector('main'),{attributes:true,attributeFilter:['hidden'],subtree:true});
 new ResizeObserver(schedule).observe(document.querySelector('.poster-view'));document.querySelector('.poster-view>img').addEventListener('load',schedule);
 addEventListener('resize',schedule);document.fonts.ready.then(schedule);schedule();
})();
