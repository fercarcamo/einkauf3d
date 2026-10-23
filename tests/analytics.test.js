import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyzeOrder,aggregate,filterOrders,DAY} from '../analytics.js';
function order(id,pairs){const events=pairs.map(([step,day])=>({step,t:day*DAY})).sort((a,b)=>a.t-b.t);return{id,events,first:events[0].t,last:events.at(-1).t,analysis:analyzeOrder(events)}}
test('Vollständiger Ablauf hat keinen Maverick-Indikator; Kennzahlen und Replay stimmen',()=>{
 const o=order('ORD1',Array.from({length:9},(_,step)=>[step,step]));
 assert.equal(o.analysis.complete,true);assert.deepEqual(o.analysis.reasons,[]);
 const k=aggregate([o],4*DAY);assert.equal(k.cycle.mean,8);assert.equal(k.delivery.mean,2);assert.equal(k.invoice.mean,2);assert.equal(k.active,1);assert.equal(k.occurred,5);assert.equal(k.paidNow,0);assert.equal(aggregate([o],8*DAY).paidNow,1);assert.equal(aggregate([o],8*DAY).active,0);
});
test('Fehlende und verspätete Freigaben sowie rückwirkende Bestellung erzeugen Verdacht',()=>{
 assert.equal(order('A',[[2,2],[4,4]]).analysis.reasons.length,2);
 assert.equal(order('B',[[0,0],[2,2],[1,3]]).analysis.reasons.length,1);
 assert.equal(order('C',[[0,0],[1,1],[4,2],[6,3],[2,4]]).analysis.reasons.length,2);
 assert.equal(order('D',[[0,0],[1,2],[2,2]]).analysis.reasons.length,0);
});
test('Ohne Bestellanlage ist Maverick nicht beurteilbar; rückläufige Zeitpaare werden ausgeschlossen',()=>{
 const o=order('A',[[8,0],[0,2],[4,3]]);assert.equal(o.analysis.assessable,false);assert.deepEqual(o.analysis.reasons,[]);const k=aggregate([o]);assert.equal(k.assessable,0);assert.equal(k.cycle.mean,null);assert.equal(k.cycle.n,0);assert.equal(k.paid,1);
});
test('Filter und ID-Suche kombinieren sich; leere Ergebnisse sind definiert',()=>{
 const a=order('ORD001',[[0,0],[1,1],[2,2],[8,8]]),b=order('ORD002',[[2,2],[4,4]]);
 assert.deepEqual(filterOrders([a,b],'maverick').map(o=>o.id),['ORD002']);assert.deepEqual(filterOrders([a,b],'paid',' ord001 ').map(o=>o.id),['ORD001']);assert.equal(filterOrders([a,b],'no-payment','001').length,0);
 const k=aggregate([]);assert.equal(k.count,0);assert.equal(k.active,0);assert.equal(k.cycle.mean,null);
});
test('Echte CSV: Filter partitionieren Bestellungen und Kennzahlen bleiben im gültigen Bereich',()=>{
 const lines=readFileSync(new URL('../P2P.csv',import.meta.url),'utf8').trim().split(/\r?\n/);const headers=lines.shift().split(',');const activities=['Create Purchase Requisition','Approve Purchase Requisition','Create Purchase Order','Send Purchase Order to Supplier','Receive Goods','Verify Goods Receipt','Create Invoice','Approve Invoice','Make Payment'];const groups=new Map();
 for(const line of lines){const values=line.split(','),id=values[headers.indexOf('Order_ID')],step=activities.indexOf(values[headers.indexOf('Activity')]),t=Date.parse(values[headers.indexOf('Timestamp')].replace(' ','T')+'Z');assert.ok(step>=0&&Number.isFinite(t));if(!groups.has(id))groups.set(id,[]);groups.get(id).push({step,t});}
 const orders=[...groups].map(([id,events])=>{events.sort((a,b)=>a.t-b.t);return{id,events,first:events[0].t,last:events.at(-1).t,analysis:analyzeOrder(events)}});
 const k=aggregate(orders);assert.equal(k.events,lines.length);assert.equal(k.count,934);assert.equal(filterOrders(orders,'paid').length+filterOrders(orders,'no-payment').length,k.count);assert.equal(filterOrders(orders,'complete').length+filterOrders(orders,'missing').length,k.count);assert.equal(filterOrders(orders,'maverick').length,k.maverick);assert.ok(k.maverick<=k.assessable);for(const name of ['cycle','delivery','invoice'])assert.ok(k[name].mean>=0&&k[name].n<=k.count);
 console.log('CSV-Auswertung:',JSON.stringify(k));
});
