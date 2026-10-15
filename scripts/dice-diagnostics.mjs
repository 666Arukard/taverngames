import {f} from './farkle-text.mjs';
export function diceMenu(foundry,{diagnostics,test}){
 const Base=foundry.applications.api.ApplicationV2;
 return class DiceDiagnostics extends Base{
  static DEFAULT_OPTIONS={id:'taverngames-dice-diagnostics',classes:['taverngames-window'],window:{title:'Taverngames · 3D',resizable:true},position:{width:Math.min(580,Math.max(240,(globalThis.innerWidth??1200)-24)),height:Math.max(180,Math.min(530,(globalThis.innerHeight??800)-90)),top:24}};
  async _renderHTML(){
   const root=document.createElement('section');root.className='taverngames-surface';const content=document.createElement('div');content.className='schocken-content';root.append(content);
   const p=document.createElement('p');p.textContent=f('Dieser Test zeigt nur dir zwei feste Würfel (3 und 5). Er verändert keine Partie und funktioniert unabhängig vom 3D-Schalter.','This test shows two fixed dice (3 and 5) only to you. It changes no game and works independently of the 3D setting.');content.append(p);
   const output=document.createElement('textarea');output.rows=15;output.readOnly=true;output.setAttribute('aria-label',f('Würfeldiagnose','Dice diagnostics'));
   const status=document.createElement('p');status.setAttribute('role','status');
   const refresh=async()=>{try{output.value=JSON.stringify(await diagnostics(),null,2);}catch{output.value=f('Diagnose konnte nicht abgerufen werden. Ist ein SL verbunden?','Could not read diagnostics. Is a GM connected?');}};
   const button=document.createElement('button');button.type='button';button.textContent=f('3D-Testwürfel anzeigen','Show 3D test dice');button.onclick=async()=>{button.disabled=true;status.textContent=f('Animation wird angefragt …','Requesting animation …');try{const result=await test();const labels={confirmed:f('Dice So Nice hat die Animation bestätigt.','Dice So Nice confirmed the animation.'),submitted:f('Auftrag übergeben, ohne Rückmeldung zur Anzeige.','Request submitted without display confirmation.'),skipped:f('Dice So Nice hat die Anzeige übersprungen. Bitte dort Sichtbarkeit und Zeichenebene prüfen.','Dice So Nice skipped the display. Check its visibility and rendering layer.'),unavailable:f('Dice So Nice ist nicht aktiv oder die Schnittstelle fehlt.','Dice So Nice is inactive or its API is missing.'),timeout:f('Keine Rückmeldung innerhalb von acht Sekunden.','No response within eight seconds.'),error:f('Animationsfehler; Details in der lokalen Konsole.','Animation error; details in the local console.')};status.textContent=labels[result]??f('Test beendet.','Test completed.');}catch{status.textContent=f('Der Würfeltest ist fehlgeschlagen. Bitte die lokale Konsole prüfen.','The dice test failed. Please check the local console.');}finally{button.disabled=false;await refresh();}};
   const reload=document.createElement('button');reload.type='button';reload.textContent=f('Diagnose aktualisieren','Refresh diagnostics');reload.onclick=refresh;
   content.append(button,status,reload,output);await refresh();return root;
  }
  _replaceHTML(result,content){content.replaceChildren(result);}
 };
}
