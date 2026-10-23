import { replayState, stationLoad, playbackSelection } from './replay.js';
import { analyzeOrder, filterOrders, filterDefinitions, aggregate } from './analytics.js';
import * as THREE from 'three';
import { station, movingObject, roles } from './models.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id), DAY=86400000;
const activities=['Create Purchase Requisition','Approve Purchase Requisition','Create Purchase Order','Send Purchase Order to Supplier','Receive Goods','Verify Goods Receipt','Create Invoice','Approve Invoice','Make Payment'];
const labels=['Bedarf anlegen','Bedarf freigeben','Bestellung anlegen','An Lieferanten senden','Ware empfangen','Wareneingang prüfen','Rechnung erstellen','Rechnung freigeben','Zahlung ausführen'];
const colors=[0x65dec7,0x65dec7,0x65dec7,0x65dec7,0xa995ff,0xa995ff,0xf4bd75,0xf4bd75,0xf4bd75];
const fmt=t=>new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(t);
const short=t=>new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeZone:'UTC'}).format(t);
let orders=[],filteredOrders=[],playbackOrders=[],currentFilter='all',start=0,end=1,time=0,playing=false,selected='',previous=performance.now(),lastUI=0,lastDetailKey='';
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x09162b,.006);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x09162b,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('canvas').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(42,1,.1,300);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.1;controls.minDistance=12;controls.maxDistance=80;
function resetCamera(){camera.position.set(24,30,37);controls.target.set(0,0,0);controls.update()}resetCamera();$('resetView').onclick=resetCamera;
scene.add(new THREE.HemisphereLight(0xd8efff,0x1b2638,2.6));const light=new THREE.DirectionalLight(0xffffff,2.8);light.position.set(0,20,10);scene.add(light);
const cyanLight=new THREE.PointLight(0x65e9ff,80,65,2);cyanLight.position.set(-16,9,2);scene.add(cyanLight);
const violetLight=new THREE.PointLight(0x9772ff,65,60,2);violetLight.position.set(18,10,-10);scene.add(violetLight);
// A static peripheral star field adds depth without competing with event motion.
const dustPositions=[];for(let i=0;i<160;i++){const angle=i*2.399963,radius=35+(i%17)*1.1;dustPositions.push(Math.cos(angle)*radius,1+(i%19)*.6,Math.sin(angle)*radius);}
const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));scene.add(new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0x78b9dd,size:.065,transparent:true,opacity:.38,depthWrite:false})));

const grid=new THREE.GridHelper(90,60,0x317a9b,0x183d59);grid.position.y=-.18;grid.material.transparent=true;grid.material.opacity=.42;scene.add(grid);
const positions=activities.map((_,i)=>new THREE.Vector3(((Math.floor(i/3)%2 ? 2-i%3 : i%3)-1)*12,0,(Math.floor(i/3)-1)*10));
function textSprite(text,index){const c=document.createElement('canvas');c.width=768;c.height=144;const ctx=c.getContext('2d');ctx.textAlign='center';ctx.fillStyle='#7c8eaa';ctx.font='500 25px sans-serif';ctx.fillText(String(index+1).padStart(2,'0')+' / '+roles[index].toUpperCase(),384,37);ctx.fillStyle='#e0eaf3';ctx.font='500 39px sans-serif';ctx.fillText(text,384,94);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false,transparent:true}));sprite.scale.set(9,1.69,1);return sprite;}
positions.forEach((p,i)=>{const group=station(i,colors[i]);group.position.copy(p);const label=textSprite(labels[i],i);label.position.set(0,3.6,0);group.add(label);scene.add(group);
 if(i<8){const a=p.clone(),b=positions[i+1].clone(),length=a.distanceTo(b),road=new THREE.Mesh(new THREE.BoxGeometry(2.2,.06,length),new THREE.MeshStandardMaterial({color:0x172e45,roughness:.45,metalness:.4}));road.position.copy(a).lerp(b,.5);road.position.y=-.1;road.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);scene.add(road);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineDashedMaterial({color:i===3?0xf4bd75:0x7a91a3,dashSize:.4,gapSize:.35}));line.computeLineDistances();scene.add(line);}});
const markerGeometry=new THREE.RingGeometry(.48,.57,24);
const markerMaterials=Array.from({length:12},(_,i)=>new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(i/12,.65,.7),side:THREE.DoubleSide}));
const agedMaterial=new THREE.MeshBasicMaterial({color:0xff795f,side:THREE.DoubleSide});
const selectionMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,side:THREE.DoubleSide});
function token(id,index){const root=new THREE.Group();root.userData.id=id;root.userData.variants={};const ring=new THREE.Mesh(markerGeometry,markerMaterials[index%12]);ring.rotation.x=-Math.PI/2;ring.position.y=.05;ring.visible=true;root.add(ring);root.userData.ring=ring;root.userData.markerMaterial=markerMaterials[index%12];return root;}
function showKind(root,kind){if(root.userData.kind===kind)return;for(const child of Object.values(root.userData.variants))child.visible=false;if(!root.userData.variants[kind]){const object=movingObject(kind);root.userData.variants[kind]=object;root.add(object);}root.userData.variants[kind].visible=true;root.userData.kind=kind;}
const stationIndicators=positions.map(p=>{
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100;
 const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(7,1.37,1);sprite.position.copy(p).add(new THREE.Vector3(0,5,0));scene.add(sprite);
 const halo=new THREE.Mesh(new THREE.RingGeometry(3.2,3.4,64),new THREE.MeshBasicMaterial({color:0x65dec7,transparent:true,opacity:.25,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.position.copy(p);halo.position.y=.08;scene.add(halo);return{canvas,texture,sprite,halo,key:''};
});
const actualLinks=new Map();
function updateBottlenecks(){
 const threshold=Number($('wait-threshold').value),load=stationLoad(playbackOrders,time,threshold),peak=load.ranked[0]?.count||0;
 const links=new Map();for(const o of playbackOrders){const state=replayState(o,time);if(state){const key=state.from+':'+state.to;links.set(key,(links.get(key)||0)+1);}}
 for(const line of actualLinks.values())line.visible=false;
 for(const [key,count] of links){let line=actualLinks.get(key);if(!line){const [from,to]=key.split(':').map(Number);const a=positions[from].clone().add(new THREE.Vector3(0,.3,0)),b=positions[to].clone().add(new THREE.Vector3(0,.3,0));line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0x65dec7,transparent:true}));scene.add(line);actualLinks.set(key,line);}line.visible=true;line.material.opacity=Math.min(.9,.25+count*.04);}
 for(const station of load.stations){const indicator=stationIndicators[station.step],hot=station.count>0&&station.count===peak,color=hot?'#ffad76':station.overdue?'#ff795f':'#a8efda';
 indicator.halo.visible=station.count>0;indicator.halo.material.color.set(color);indicator.halo.material.opacity=hot?.85:.3;
 const key=station.count+':'+station.meanAge.toFixed(1)+':'+hot+':'+station.overdue;
 if(key!==indicator.key){indicator.key=key;const ctx=indicator.canvas.getContext('2d');ctx.clearRect(0,0,512,100);ctx.fillStyle='#0c1725ee';ctx.fillRect(0,0,512,100);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='600 31px sans-serif';ctx.fillText(station.count+' Vorgänge · Ø '+station.meanAge.toLocaleString('de-DE',{maximumFractionDigits:1})+' Tage',256,62);indicator.texture.needsUpdate=true;}}
 $('bottleneck-title').textContent=peak?'Größter Bestand nach: '+labels[load.ranked[0].step]:'Aktuell keine laufenden Vorgänge';
 $('bottleneck-list').replaceChildren();for(const station of [...load.ranked,...load.stations.filter(s=>!s.count)]){const row=document.createElement('div');row.className='load-row';const name=document.createElement('span'),value=document.createElement('strong'),bar=document.createElement('i'),detail=document.createElement('small');name.textContent='Nach: '+labels[station.step];value.textContent=station.count+' Vorgänge';bar.style.width=(peak?station.count/peak*100:0)+'%';detail.textContent='Ø '+station.meanAge.toLocaleString('de-DE',{maximumFractionDigits:1})+' Tage seit Ereignis · '+station.overdue+' ≥ '+threshold+' Tage';row.append(name,value,bar,detail);$('bottleneck-list').append(row);}
 $('log-end-count').textContent=load.endedWithoutPayment+' Vorgänge am Log-Ende ohne Zahlung: Status unbekannt; nicht als laufender Bestand gezählt.';
}
$('wait-threshold').onchange=()=>{updateBottlenecks()};
const trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8}));scene.add(trail);
function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}const head=rows.shift().map(x=>x.replace(/^\uFEFF/,''));return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));}
function updateDetails(){const o=orders.find(o=>o.id===selected);const detailKey=filteredOrders.length+':'+selected+':'+(o?o.events.filter(e=>e.t<=time).length:0);if(detailKey===lastDetailKey)return;lastDetailKey=detailKey;$('details').replaceChildren();if(!o){const h=document.createElement('h2');h.textContent=filteredOrders.length?'Bestellungen entdecken.':'Keine Treffer.';const p=document.createElement('p');p.textContent=filteredOrders.length?'Wähle eine Bestellung, um ihren Verlauf und die Zeit zwischen Ereignissen zu erkunden.':'Ändere die Filter oder setze die Suche zurück.';$('details').append(h,p);trail.visible=false;return;}const h=document.createElement('h3');h.textContent=o.id;$('details').append(h);const summary=document.createElement('p');summary.className='summary';summary.textContent=`${o.events.length} Ereignisse · ${((o.last-o.first)/DAY).toFixed(1)} Tage beobachtet`;$('details').append(summary);const assessment=document.createElement('p');assessment.className=o.analysis.reasons.length?'assessment warning':'assessment';assessment.textContent=o.analysis.reasons.length?'Maverick-Verdacht: '+o.analysis.reasons.join(' · '):o.analysis.assessable?'Kein Maverick-Indikator nach der verwendeten Regel.':'Maverick Buying nicht beurteilbar: Bestellanlage fehlt im Log.';$('details').append(assessment);o.events.forEach((e,i)=>{const node=document.createElement('div');node.className='event'+(e.t<=time?' done':'')+(e.t<=time&&(!o.events[i+1]||o.events[i+1].t>time)?' current':'');node.textContent=labels[e.step]+' · '+roles[e.step];const sub=document.createElement('small');sub.textContent=fmt(e.t)+(i?' · '+((e.t-o.events[i-1].t)/DAY).toFixed(1)+' Tage später':'');node.append(sub);$('details').append(node);});trail.geometry.dispose();trail.geometry=new THREE.BufferGeometry().setFromPoints(o.events.map(e=>positions[e.step].clone().add(new THREE.Vector3(0,.4,0))));trail.visible=true;}
const number=value=>value.toLocaleString('de-DE');
const percent=(n,total)=>total?(n/total*100).toLocaleString('de-DE',{maximumFractionDigits:1})+' %':'—';
function renderKPIs(stats){
 const duration=(label,data,description)=>({label,value:data.mean===null?'—':data.mean.toLocaleString('de-DE',{maximumFractionDigits:1})+' Tage',note:`${description} · n = ${number(data.n)}`});
 const cards=[{label:'Maverick-Verdachtsquote',value:percent(stats.maverick,stats.assessable),note:`${number(stats.maverick)} von ${number(stats.assessable)} beurteilbar`,warning:true},
 duration('Ø P2P-Durchlaufzeit',stats.cycle,'Bedarf → Zahlung'),duration('Ø Beschaffungszeit',stats.delivery,'Bestellung → Wareneingang'),duration('Ø Zahlungszeit',stats.invoice,'Rechnung → Zahlung'),
 {label:'Zahlung protokolliert',value:percent(stats.paid,stats.count),note:`${number(stats.paid)} von ${number(stats.count)} Bestellungen`},
 {label:'Alle 9 Schritte vorhanden',value:percent(stats.complete,stats.count),note:`${number(stats.complete)} von ${number(stats.count)} Bestellungen`}];
 $('kpis').replaceChildren();for(const card of cards){const node=document.createElement('article');node.className='kpi'+(card.warning?' kpi-warning':'');const label=document.createElement('span'),value=document.createElement('strong'),note=document.createElement('small');label.textContent=card.label;value.textContent=card.value;note.textContent=card.note;node.append(label,value,note);$('kpis').append(node);}
}
function applyFilters(){
 filteredOrders=filterOrders(orders,currentFilter,$('search').value);const allowed=new Set(filteredOrders.map(o=>o.id));
 for(const o of orders){o.matchesFilter=allowed.has(o.id);if(!o.matchesFilter)o.mesh.visible=false;}
 if(!allowed.has(selected))selected='';
 $('order').replaceChildren(new Option('Alle aus aktuellem Filter',''));for(const o of filteredOrders)$('order').append(new Option(o.id,o.id));$('order').value=selected;$('order').disabled=!filteredOrders.length;
 for(const option of $('filter-select').options){const definition=filterDefinitions.find(f=>f.id===option.value);const count=filterOrders(orders,definition.id,$('search').value).length;option.textContent=definition.label+' ('+number(count)+')';}
 $('filter-select').value=currentFilter;
 applyPlaybackSelection();
}
function applyPlaybackSelection(){
 const scope=playbackSelection(filteredOrders,selected);selected=scope.selectedId;playbackOrders=scope.orders;
 const allowed=new Set(playbackOrders.map(o=>o.id));for(const o of orders){o.matchesFilter=allowed.has(o.id);if(!o.matchesFilter)o.mesh.visible=false;}
 start=scope.start??0;end=scope.end??start;time=start;
 if(!playbackOrders.length||end<=start){playing=false;$('play').textContent='▶ Abspielen';}
 $('play').disabled=!playbackOrders.length||end<=start;$('timeline').disabled=$('play').disabled;$('restart').disabled=!playbackOrders.length;
 $('start').textContent=playbackOrders.length?short(start):'—';$('end').textContent=playbackOrders.length?short(end):'—';$('order').value=selected;
 $('inspector-panel').open=!!selected;$('bottleneck-panel').open=!selected;
 const stats=aggregate(playbackOrders,time);$('cases').textContent=number(stats.count);$('events').textContent=number(stats.events);
 const filterName=filterDefinitions.find(f=>f.id===currentFilter).label;
 $('filter-result').textContent=`${number(stats.count)} von ${number(orders.length)} Bestellungen · ${number(stats.events)} Ereignisse`;
 $('playback-scope').textContent=selected?'WIEDERGABE · '+selected:'WIEDERGABE · '+filterName.toUpperCase()+' · '+number(stats.count)+' BESTELLUNGEN';
 $('clear-filters').disabled=currentFilter==='all'&&!$('search').value&&!selected;
 renderKPIs(stats);lastDetailKey='';updateUI();
}
for(const definition of filterDefinitions)$('filter-select').append(new Option(definition.label,definition.id));
$('filter-select').onchange=()=>{currentFilter=$('filter-select').value;selected='';applyFilters()};
$('search').addEventListener('input',()=>{selected='';applyFilters()});$('clear-filters').onclick=()=>{currentFilter='all';selected='';$('search').value='';applyFilters()};
function updateUI(){ $('date').textContent=playbackOrders.length?fmt(time):'Keine Auswahl';$('timeline').value=end>start?(time-start)/(end-start)*10000:0;const stats=aggregate(playbackOrders,time);$('active').textContent=number(stats.active);$('replay-summary').textContent=`AM WIEDERGABEZEITPUNKT · ${number(stats.started)} gestartet · ${number(stats.active)} aktiv · ${number(stats.paidNow)} mit Zahlung · ${number(stats.occurred)} Ereignisse — in der Filterauswahl`;updateDetails();updateBottlenecks();}
function toggle(){playing=!playing;$('play').textContent=playing?'Ⅱ Pausieren':'▶ Abspielen';}
$('play').onclick=()=>{if(time>=end)time=start;toggle()};$('restart').onclick=()=>{time=start;updateUI()};$('timeline').oninput=()=>{time=start+Number($('timeline').value)/10000*(end-start);updateUI()};$('order').onchange=()=>{selected=$('order').value;applyPlaybackSelection()};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(orders.map(o=>o.mesh).filter(m=>m.visible),true)[0];if(hit){let object=hit.object;while(object&&!object.userData.id)object=object.parent;if(!object)return;selected=object.userData.id;$('order').value=selected;applyPlaybackSelection();}});
new ResizeObserver(()=>{const width=$('canvas').clientWidth,height=$('canvas').clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}).observe($('canvas'));
function animate(now){requestAnimationFrame(animate);const delta=Math.min((now-previous)/1000,.1);previous=now;if(playing){time=Math.min(end,time+delta*DAY*Number($('speed').value));if(time===end)toggle();}const slots=new Map(),threshold=Number($('wait-threshold').value);
 for(let oi=0;oi<orders.length;oi++){
 const o=orders[oi],m=o.mesh,state=o.matchesFilter?replayState(o,time):null;m.visible=!!state;if(!state)continue;
 const {from,to,progress,ageDays}=state;
 const slot=slots.get(from)||0;slots.set(from,slot+1);
 // Separate every simultaneous order into a stable station queue, not overlapping lanes.
 const offset=new THREE.Vector3((slot%7-3)*.72,0,3.1+Math.floor(slot/7)*.72);
 const origin=positions[from].clone().add(offset),destination=positions[to].clone().add(new THREE.Vector3(0,0,3.1));
 const kind=from===3&&(to===4||to===5)?'truck':from===4||from===5?'parcel':from>=7?'payment':'document';showKind(m,kind);
 m.position.lerpVectors(origin,destination,progress);m.position.y=.18;
 const direction=new THREE.Vector3().subVectors(destination,origin);
 m.rotation.y=kind==='truck'?-Math.atan2(direction.z,direction.x):.35;
 m.scale.setScalar(kind==='truck'?.48:.8);
 const ring=m.userData.ring;ring.visible=true;ring.material=selected===o.id?selectionMaterial:ageDays>=threshold?agedMaterial:m.userData.markerMaterial;ring.scale.setScalar(selected===o.id?1.4:1);
 if(kind==='truck'){for(const wheel of m.userData.variants.truck.userData.wheels||[])wheel.rotation.y=-progress*direction.length()*4;}
 }if(now-lastUI>150){updateUI();lastUI=now;}controls.update();renderer.render(scene,camera);}
async function load(){try{const response=await fetch('./P2P.csv');if(!response.ok)throw Error(`CSV konnte nicht geladen werden (${response.status})`);const rows=parseCSV(await response.text()),map=new Map();for(const r of rows){const step=activities.indexOf(r.Activity),t=Date.parse(r.Timestamp.replace(' ','T')+'Z');if(!r.Order_ID||step<0||!Number.isFinite(t))throw Error('Ungültige CSV-Zeile: Order_ID, Activity und Timestamp prüfen.');if(!map.has(r.Order_ID))map.set(r.Order_ID,[]);map.get(r.Order_ID).push({step,t});}if(!map.size)throw Error('Die CSV enthält keine Ereignisse.');orders=[...map].sort(([a],[b])=>a.localeCompare(b)).map(([id,events],index)=>{events.sort((a,b)=>a.t-b.t);const mesh=token(id,index);scene.add(mesh);return{id,events,analysis:analyzeOrder(events),matchesFilter:true,first:events[0].t,last:events.at(-1).t,mesh}});start=Math.min(...orders.map(o=>o.first));end=Math.max(...orders.map(o=>o.last));time=start;applyFilters();$('range').textContent='CSV-Zeitangaben unverändert · ohne Zeitzonenumrechnung';$('start').textContent=short(start);$('end').textContent=short(end);$('loading').hidden=true;updateUI();requestAnimationFrame(animate);}catch(e){$('loading').textContent=e.message;$('status').textContent='Laden fehlgeschlagen';console.error(e)}}load();
