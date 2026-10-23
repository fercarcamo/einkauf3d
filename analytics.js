export const DAY = 86400000;
export const filterDefinitions = [
  {id:'all',label:'Alle Bestellungen',matches:()=>true},
  {id:'maverick',label:'Maverick Buying · Verdacht',matches:o=>o.analysis.reasons.length>0},
  {id:'complete',label:'Alle 9 Schritte',matches:o=>o.analysis.complete},
  {id:'missing',label:'Fehlende Schritte',matches:o=>!o.analysis.complete},
  {id:'paid',label:'Zahlung im Log',matches:o=>o.analysis.payment!==null},
  {id:'no-payment',label:'Keine Zahlung im Log',matches:o=>o.analysis.payment===null},
];
export function analyzeOrder(events) {
  const times=Array.from({length:9},(_,step)=>events.filter(e=>e.step===step).map(e=>e.t).sort((a,b)=>a-b));
  const first=step=>times[step][0]??null;
  const po=first(2), reasons=[];
  if(po!==null){
    if(!times[0].some(t=>t<=po))reasons.push('Keine Bedarfsanforderung vor Bestellung protokolliert');
    if(!times[1].some(t=>t<=po))reasons.push('Keine Bedarfsfreigabe vor Bestellung protokolliert');
    if(times[4].some(t=>t<po))reasons.push('Wareneingang vor Bestellanlage');
    if(times[6].some(t=>t<po))reasons.push('Rechnung vor Bestellanlage');
  }
  return {reasons,assessable:po!==null,complete:times.every(t=>t.length>0),payment:first(8),times};
}
export function filterOrders(orders,filter='all',search='') {
  const definition=filterDefinitions.find(f=>f.id===filter)??filterDefinitions[0];
  const query=search.trim().toLowerCase();
  return orders.filter(o=>definition.matches(o)&&o.id.toLowerCase().includes(query));
}
export function aggregate(orders,now=Infinity) {
  let events=0,active=0,occurred=0,started=0,paidNow=0,paid=0,maverick=0,assessable=0,complete=0;
  const durations={cycle:[],delivery:[],invoice:[]};
  for(const o of orders){
    const a=o.analysis;
    events+=o.events.length;occurred+=o.events.filter(e=>e.t<=now).length;
    if(o.first<=now){started++;if(now<o.last&&o.events.filter(e=>e.t<=now).at(-1)?.step!==8)active++;}
    if(a.payment!==null){paid++;if(a.payment<=now)paidNow++;}
    if(a.assessable)assessable++;
    if(a.reasons.length)maverick++;
    if(a.complete)complete++;
    for(const [name,from,to] of [['cycle',0,8],['delivery',2,4],['invoice',6,8]]){
      const begin=a.times[from][0];
      const finish=begin===undefined?undefined:a.times[to].find(t=>t>=begin);
      if(finish!==undefined)durations[name].push((finish-begin)/DAY);
    }
  }
  const result={count:orders.length,events,active,occurred,started,paidNow,paid,maverick,assessable,complete};
  for(const [key,values] of Object.entries(durations))result[key]={mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,n:values.length};
  return result;
}
