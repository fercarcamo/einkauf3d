import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY} from '../analytics.js';
import {replayState,stationLoad} from '../replay.js';
const make=pairs=>{const events=pairs.map(([step,day])=>({step,t:day*DAY})).sort((a,b)=>a.t-b.t);return{events,first:events[0].t,last:events.at(-1).t}};
test('Vorgang wartet beim tatsächlichen letzten Ereignis und erreicht das nächste pünktlich',()=>{
 const o=make([[0,0],[2,10],[4,20]]);
 assert.equal(replayState(o,-1),null);
 const waiting=replayState(o,5*DAY);assert.equal(waiting.from,0);assert.equal(waiting.to,2);assert.equal(waiting.progress,0);assert.equal(waiting.ageDays,5);
 const handover=replayState(o,9.9*DAY);assert.ok(handover.progress>0&&handover.progress<1);
 assert.equal(replayState(o,10*DAY).from,2);assert.equal(replayState(o,10*DAY).ageDays,0);assert.equal(replayState(o,20*DAY),null);
});
test('Zeitgleiche Ereignisse, Rücksprünge und fehlende Schritte folgen dem Log',()=>{
 const o=make([[0,0],[2,0],[1,4],[8,6]]);
 assert.equal(replayState(o,0).from,2);assert.equal(replayState(o,0).to,1);
 assert.equal(replayState(o,4*DAY).from,1);assert.equal(replayState(o,4*DAY).to,8);
 assert.equal(replayState(make([[2,0]]),0),null);
});
test('Parallele Bestände, Alter, Schwellwerte und unbekannte Endzustände stimmen',()=>{
 const a=make([[0,0],[2,10]]),b=make([[0,2],[8,11]]),c=make([[2,1],[8,12]]),d=make([[0,0],[1,3]]);
 const snapshot=stationLoad([a,b,c,d],8*DAY,7);
 assert.equal(snapshot.stations[0].count,2);assert.equal(snapshot.stations[0].meanAge,7);assert.equal(snapshot.stations[0].maxAge,8);assert.equal(snapshot.stations[0].overdue,1);assert.equal(snapshot.ranked[0].step,0);assert.equal(snapshot.endedWithoutPayment,1);
 assert.equal(snapshot.stations.reduce((n,s)=>n+s.count,0),3);
 assert.equal(stationLoad([c],8*DAY).stations[0].count,0);assert.equal(stationLoad([],8*DAY).ranked.length,0);
});

test('Einzelauswahl begrenzt Wiedergabe, Kennzahlen, Bestände und Zeitraum auf denselben Vorgang',async()=>{
 const {playbackSelection}=await import('../replay.js');
 const {analyzeOrder,aggregate,filterOrders}=await import('../analytics.js');
 const a={id:'ORD-A',...make([[0,0],[1,1],[2,2],[8,10]])};
 const b={id:'ORD-B',...make([[2,20],[4,30]])};
 for(const o of [a,b])o.analysis=analyzeOrder(o.events);
 const cohort=filterOrders([a,b],'maverick');assert.deepEqual(cohort.map(o=>o.id),['ORD-B']);
 let scope=playbackSelection([a,b],'ORD-A');assert.deepEqual(scope.orders,[a]);assert.equal(scope.start,0);assert.equal(scope.end,10*DAY);assert.equal(aggregate(scope.orders).count,1);assert.equal(stationLoad(scope.orders,5*DAY).stations[2].count,1);
 scope=playbackSelection(cohort,'ORD-A');assert.equal(scope.selectedId,'');assert.deepEqual(scope.orders,[b]);assert.equal(scope.start,20*DAY);assert.equal(scope.end,30*DAY);
 scope=playbackSelection([a,b],'');assert.equal(scope.orders.length,2);assert.equal(scope.end,30*DAY);
 scope=playbackSelection([],'ORD-A');assert.deepEqual(scope.orders,[]);assert.equal(scope.start,null);assert.equal(scope.end,null);
});

test('Zahlung ist trotz Folgeereignissen kein Engpass; Abschlusszahlen sind getrennt',async()=>{
 const {aggregate,analyzeOrder}=await import('../analytics.js');
 const paid=Array.from({length:20},()=>make([[0,0],[8,1],[0,20],[2,30]]));
 const waiting=make([[1,0],[2,15]]);
 const orders=[...paid,waiting];for(const o of orders)o.analysis=analyzeOrder(o.events);
 const snapshot=stationLoad(orders,10*DAY,3);
 assert.equal(snapshot.completed,20);assert.equal(snapshot.stations[8].count,0);
 assert.equal(snapshot.stations[8].overdue,0);assert.deepEqual(snapshot.ranked.map(s=>s.step),[1]);
 assert.equal(aggregate(orders,10*DAY).active,1);
 assert.equal(stationLoad(paid,10*DAY).ranked.length,0);
 assert.equal(stationLoad(paid,0).completed,0);
 assert.equal(stationLoad(paid,22*DAY).stations[0].count,20);
 assert.equal(stationLoad(paid,40*DAY).completed,20);
});
