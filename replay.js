import {DAY} from './analytics.js';
// Events are sorted chronologically. Inter-event intervals are observed residence,
// not measured task processing times. A short visual handover ends at the next event.
export function replayState(order,now){
 if(now<order.first||now>=order.last)return null;
 let index=0;while(index<order.events.length-1&&order.events[index+1].t<=now)index++;
 const from=order.events[index],to=order.events[index+1];if(!to)return null;
 const duration=to.t-from.t,age=now-from.t;
 const handover=Math.min(duration*.12,DAY*.35);
 const progress=handover>0?Math.max(0,Math.min(1,(now-(to.t-handover))/handover)):0;
 return {from:from.step,to:to.step,ageDays:age/DAY,progress,index};
}
export function stationLoad(orders,now,thresholdDays=7){
 const stations=Array.from({length:9},(_,step)=>({step,count:0,totalAge:0,maxAge:0,overdue:0,meanAge:0}));
 let endedWithoutPayment=0,completed=0;
 for(const o of orders){if(o.events.some(e=>e.step===8&&e.t<=now))completed++;const state=replayState(o,now);if(!state){if(now>=o.last&&!o.events.some(e=>e.step===8&&e.t<=now))endedWithoutPayment++;continue;}
 // Payment is a completion event, never an inter-event waiting queue.
 if(state.from===8)continue;
 const s=stations[state.from];s.count++;s.totalAge+=state.ageDays;s.maxAge=Math.max(s.maxAge,state.ageDays);if(state.ageDays>=thresholdDays)s.overdue++;}
 for(const s of stations)s.meanAge=s.count?s.totalAge/s.count:0;
 const ranked=stations.filter(s=>s.step!==8&&s.count).sort((a,b)=>b.count-a.count||b.meanAge-a.meanAge||a.step-b.step);
 return {stations,ranked,endedWithoutPayment,completed};
}

// One shared scope for the scene, timeline, KPIs and station loads.
export function playbackSelection(candidates,selectedId=''){
 const selected=candidates.find(o=>o.id===selectedId);
 const orders=selected?[selected]:candidates;
 return {orders,selectedId:selected?.id??'',start:orders.length?Math.min(...orders.map(o=>o.first)):null,end:orders.length?Math.max(...orders.map(o=>o.last)):null};
}
