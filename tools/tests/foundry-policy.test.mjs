import test from 'node:test';
import assert from 'node:assert/strict';
import { eligible,publishFoundry } from '../foundry-publish.mjs';
const p={enabled:true,baselineVersion:'5.0.3',oneTimeVersion:'5.1.3'};
const done=v=>({tag_name:`v${v}`,body:`<!-- foundry-published:${v} -->`});
test('Gezielte Ausnahme genau einmal und danach keine Z-Patches',()=>{
  assert.equal(eligible('5.1.3',p,[]),true);
  assert.equal(eligible('5.1.3',p,[done('5.1.3')]),false);
  assert.equal(eligible('5.1.4',p,[done('5.1.3')]),false);
  assert.equal(eligible('5.0.4',p,[]),false);
});
test('Neue Minor-/Hauptlinie erlaubt; keine Rückstufung und Pause wirksam',()=>{
  assert.equal(eligible('5.2.0',p,[done('5.1.3')]),true);
  assert.equal(eligible('6.0.0',p,[done('5.1.3')]),true);
  assert.equal(eligible('5.1.5',p,[done('5.2.0')]),false);
  assert.equal(eligible('5.1.3',p,[done('5.2.0')]),false);
  assert.equal(eligible('5.2.1',p,[done('5.2.0')]),false);
  assert.equal(eligible('5.2.0',{...p,enabled:false},[]),false);
});
test('Übersprungener Patch berührt Foundry nicht',async()=>{
  let calls=0;
  const result=await publishFoundry('5.1.4',{policy:p,request:async(url,options)=>{
    calls++;assert.ok(url.startsWith('https://api.github.com/'));assert.equal(options.method,'GET');
    return {ok:true,json:async()=>[done('5.1.3')]};
  }});
  assert.equal(calls,1);assert.match(result,/kein Foundry-Aufruf/);
});
