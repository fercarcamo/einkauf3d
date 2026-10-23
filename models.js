import * as THREE from 'three';
const mats=new Map();
function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.25}));return mats.get(color)}
function box(g,x,y,z,w,h,d,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m}
function cylinder(g,x,y,z,r,h,c){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(c));m.position.set(x,y,z);g.add(m);return m}
const navy=0x344b69,white=0xe8eff3,wood=0x425d78,skin=0xe4b397;
function person(g,x,z,suit=0x529aaf,boss=false){const p=new THREE.Group();p.position.set(x,0,z);box(p,0,.82,0,.42,.65,.3,suit);cylinder(p,0,1.39,0,.22,.36,skin);box(p,0,1.57,-.02,.4,.11,.35,0x3c3033);for(const side of [-1,1]){box(p,side*.12,.28,0,.15,.5,.18,navy);box(p,side*.13,.07,.06,.18,.13,.3,0x202c3c);const arm=box(p,side*.31,.86,.12,.15,.53,.17,suit);arm.rotation.x=-.45;}if(boss)box(p,0,.91,.16,.07,.4,.025,0xeebc65);g.add(p);return p}
function desk(g,x,z){box(g,x,.86,z,1.8,.12,.95,wood);for(const side of [-1,1])box(g,x+side*.7,.43,z,.1,.85,.65,navy);box(g,x,1.23,z-.18,.65,.48,.07,navy);box(g,x,1.23,z-.13,.55,.37,.025,0x7ac9df);box(g,x,.98,z+.25,.65,.035,.22,0xd0dce6);}
function parcel(g,x,y,z,s=.6){box(g,x,y+s/2,z,s,s,s,0xc79962);box(g,x,y+s+.012,z,.12,.025,s+.02,0xeed19c);box(g,x,y+s*.5,z+s/2+.012,.12,s,.02,0xeed19c);}
function sign(g,text,x,y,z,width=3){const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#16283a';ctx.fillRect(0,0,512,100);ctx.fillStyle='#e4eef4';ctx.font='600 40px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,65);const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width/5.12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(x,y,z);g.add(m);}
function building(g,name,color){box(g,0,1.15,-.8,4,2.3,1.7,white);box(g,0,2.38,-.8,4.25,.18,1.95,color);box(g,0,1,-.8+ .87,.65,1.8,.06,navy);for(const x of [-1.3,1.3]){box(g,x,1.3,.07,.8,.85,.05,0x79bad2);box(g,x,1.3,.11,.035,.85,.035,white);}sign(g,name,0,2.02,.1);}
function shelf(g,x,z){for(const y of [.2,.95,1.7]){box(g,x,y,z,1.55,.08,.75,navy);parcel(g,x-.4,y+.05,z,.5);parcel(g,x+.35,y+.05,z,.5);}for(const dx of [-.78,.78])box(g,x+dx,1,z,.08,2,.8,navy);}
export const roles=['Fachbereich','Chef · Freigabe','Einkauf','Lieferant · Auftragsannahme','Lager · Warenannahme','Lager · Qualitätsprüfung','Lieferant · Fakturierung','Buchhaltung · Freigabe','Finanzen · Zahlung'];
export function station(index,color){const g=new THREE.Group();box(g,0,-.08,0,6,.22,5,0x23374a);box(g,0,.04,2.43,6,.05,.08,color);
 if(index===0){desk(g,-1,0);person(g,-1,.85);desk(g,1.15,-.35);person(g,1.15,.5,0x719d7d);sign(g,'FACHBEREICH',0,2.15,-1.6);}
 if(index===1){box(g,0,1.3,-1.8,5,2.6,.14,0x39435b);sign(g,'FREIGABE',0,2,-1.69);desk(g,0,0);person(g,0,-.8,0x46567a,true);box(g,.7,.99,.2,.4,.04,.55,white);cylinder(g,.7,1.12,.2,.09,.22,0xbe7768);}
 if(index===2){desk(g,-.9,0);person(g,-.9,.85,0x3a9e97);shelf(g,1.6,-1.1);sign(g,'EINKAUF',-.8,2.2,-1.6);}
 if(index===3){building(g,'LIEFERANT',color);parcel(g,-1.6,0,1.15,.7);parcel(g,-.75,0,1.2,.6);person(g,1.6,1.2,0xb47d4e);}
 if(index===4){building(g,'WARENEINGANG',color);box(g,0,.55,.1,1.8,1.1,.1,0x45566b);for(const x of [-1.3,0,1.3])parcel(g,x,0,1.25,.7);person(g,2,1,0xe3a844);}
 if(index===5){shelf(g,-1.6,-.9);desk(g,.7,.3);parcel(g,.7,.93,.3,.6);person(g,1.8,1,0xa995dd);sign(g,'WARENPRÜFUNG',.4,2.3,-1.6);}
 if(index===6){desk(g,0,0);person(g,0,.9,0xc28f58);box(g,1.5,.5,-.6,.8,1,1,white);box(g,1.5,1.04,-.6,.65,.1,.7,navy);box(g,1.5,1.15,-.6,.5,.07,.6,white);sign(g,'RECHNUNG',0,2.2,-1.6);}
 if(index===7){desk(g,-.7,0);person(g,-.7,.85,0x9675b9,true);box(g,.8,.98,.1,.5,.04,.65,white);sign(g,'BUCHHALTUNG',0,2.2,-1.6);}
 if(index===8){building(g,'FINANZEN',color);for(const x of [-1.3,0,1.3])cylinder(g,x,1.2,.45,.13,2.2,0xc8d6e3);for(let j=0;j<4;j++)cylinder(g,1.8,.1+j*.12,1.6,.4,.1,0xeec364);person(g,-1.8,1.4,0x4d777e,true);}
 // Luminous platform edges and inset corner beacons keep each department readable.
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.08,.25,5.08)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));outline.position.y=-.06;g.add(outline);
 const glow=new THREE.MeshBasicMaterial({color});
 for(const x of [-2.85,2.85])for(const z of [-2.3,2.3]){const beacon=new THREE.Mesh(new THREE.BoxGeometry(.08,.15,.35),glow);beacon.position.set(x,.12,z);g.add(beacon);}
 return g;}
export function movingObject(kind){const g=new THREE.Group();
 if(kind==='truck'){box(g,-.25,.65,0,1.55,1.05,.85,0xe1e9ed);box(g,.88,.47,0,.7,.72,.84,0x48aeac);box(g,1.02,.68,.431,.4,.28,.025,0x233d58);box(g,1.02,.68,-.431,.4,.28,.025,0x233d58);box(g,.1,.19,0,2.55,.13,.7,navy);for(const x of [-.75,.9])for(const z of [-.46,.46]){const wheel=cylinder(g,x,.22,z,.23,.14,0x18232f);wheel.rotation.x=Math.PI/2;g.userData.wheels??=[];g.userData.wheels.push(wheel);}for(const z of [-.28,.28])box(g,1.245,.4,z,.03,.14,.14,0xffecba);}
 else if(kind==='parcel'){parcel(g,0,0,0,.6);}
 else if(kind==='payment'){for(let i=0;i<3;i++)cylinder(g,0,.1+i*.12,0,.3,.1,0xf4c967);}
 else {box(g,0,.35,0,.48,.65,.08,0xf0eee1);box(g,-.09,.52,.05,.19,.04,.02,0x55b3ae);for(let i=0;i<3;i++)box(g,0,.39-i*.1,.05,.31,.025,.02,0x8a9daf);}
 return g;}
