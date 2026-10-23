// A fixed 1600×900 stage fits within the viewport; spare space becomes letterboxing.
function fitStage(){document.documentElement.style.setProperty('--frame-scale',Math.min(innerWidth/1600,innerHeight/900));}
fitStage();addEventListener('resize',fitStage);
const frame=document.getElementById('video-frame'),fullscreen=document.getElementById('fullscreen');
fullscreen.addEventListener('click',async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
 catch{fullscreen.textContent='Browser-Vollbild nutzen';fullscreen.title='Vollbild ist hier nicht verfügbar. Bitte die Vollbildfunktion des Browsers verwenden.';}
});
document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'⛶ Vollbild beenden':'⛶ Vollbild';fitStage()});
const info=document.getElementById('info-dialog');document.getElementById('info-button').onclick=()=>info.showModal();
info.addEventListener('click',e=>{if(e.target===info){const r=info.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)info.close();}});
const panels=[...document.querySelectorAll('.rail-panel')];
for(const panel of panels)panel.addEventListener('toggle',()=>{if(panel.open)for(const other of panels)if(other!==panel)other.open=false;});
