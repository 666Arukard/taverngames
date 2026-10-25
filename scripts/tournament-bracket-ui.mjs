import {bracketModel} from './tournament-bracket.mjs';
import {f} from './farkle-text.mjs';
const svg=(tag,attributes={},text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))e.setAttribute(key,String(value));if(text!==undefined)e.textContent=text;return e;};
export function renderTournamentBracket(parent,state,ui){
 const model=bracketModel(state);if(!model.rounds.length)return;
 const details=document.createElement('details');details.className='taverngames-tournament-bracket';details.open=ui.bracketOpen??false;details.ontoggle=()=>ui.bracketOpen=details.open;
 const title=document.createElement('summary');title.textContent=f('Turnierplan anzeigen / ausblenden','Show / hide tournament bracket');details.append(title);
 const scroll=document.createElement('div');scroll.className='taverngames-bracket-scroll';const width=model.rounds.length*220+200,height=model.rounds[0].length*100+55,chart=svg('svg',{width,height,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':f('Turnierbaum mit ausgeschiedenen Spielern und Siegerwegen','Tournament tree with eliminated players and winning paths')});
 const center=(stage,index)=>35+(index+.5)*100*2**stage;
 for(let r=0;r<model.rounds.length;r++){
  chart.append(svg('text',{x:10+r*220,y:20,class:'bracket-heading'},f('Stufe ','Stage ')+(r+1)));
  for(const m of model.rounds[r]){const x=10+r*220,y=center(r,m.index)-30;
   if(r>0)for(let side=0;side<2;side++){const child=model.rounds[r-1][m.index*2+side],cy=center(r-1,m.index*2+side),end=y+15+side*30;chart.append(svg('path',{d:`M ${x-30} ${cy} H ${x-15} V ${end} H ${x}`,class:child.winner?'bracket-path is-advanced':'bracket-path'}));}
   for(const [side,id]of [m.a,m.b].entries()){const loser=m.losers.includes(id),win=!!id&&m.winner===id;chart.append(svg('rect',{x,y:y+side*30,width:180,height:30,rx:4,class:win?'bracket-seat is-winner':'bracket-seat'}));const name=id?ui.name(id):m.bye&&side===1?f('Freilos','Bye'):f('Noch offen','Pending'),label=svg('text',{x:x+8,y:y+20+side*30,class:loser?'bracket-name is-eliminated':'bracket-name'},name.length>22?name.slice(0,21)+'…':name);label.append(svg('title',{},name));chart.append(label);}
  }
 }
 const final=model.rounds.at(-1)[0],x=10+model.rounds.length*220,y=center(model.rounds.length-1,0);chart.append(svg('path',{d:`M ${x-30} ${y} H ${x}`,class:final.winner?'bracket-path is-advanced':'bracket-path'}));chart.append(svg('rect',{x,y:y-20,width:180,height:40,rx:5,class:'bracket-seat is-winner'}));chart.append(svg('text',{x:x+8,y:y+5,class:'bracket-name'},model.champion?ui.name(model.champion):f('Turniersieger','Champion')));
 scroll.append(chart);details.append(scroll);parent.append(details);
}
