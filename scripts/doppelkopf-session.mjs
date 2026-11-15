import {MahjongSession} from './mahjong-session.mjs';
import {DOPPELKOPF_PROFILE,createDoppelkopf,actDoppelkopf,doppelkopfView,doppelkopfNpc} from './doppelkopf-engine.mjs';

export class DoppelkopfSession extends MahjongSession {
  restore(state) {
    if (state && (state.version!==1||state.game!=='doppelkopf')) throw Error('Invalid game save.');
    this.state=structuredClone(state);
    this.wait=this.now()+900;
  }

  project(user) { return doppelkopfView(this.state,user); }

  async handleNow(data,user) {
    if (!this.enabled()&&!(data.action==='abort'&&user.isGM)) throw Error('Beta testing is disabled.');
    if (data.action==='read') return this.project(user);
    const old=this.state;
    if (!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1)) {
      throw Error('The game state changed. Please try again.');
    }
    const args=data.args??{};
    let next;
    if (['lobby','restart'].includes(data.action)) {
      if (!user.isGM) throw Error('GM only.');
      if (old&&!['lobby','finished','aborted'].includes(old.phase)) throw Error('Finish or end the current game first.');
      if (data.action==='restart') {
        if (!old) throw Error('No game exists.');
        next=createDoppelkopf({cardSet:{...old.cardSet,cards:Object.values(old.cards)},npcs:old.npcs});
        next.players=[...old.players];
        next.npcManual={...old.npcManual};
      } else {
        const names=args.npcs??[];
        if (!Array.isArray(names)||names.length>4||names.some(name=>typeof name!=='string'||!name.trim()||name.length>60)) throw Error('Invalid NPCs.');
        const npcs=Object.fromEntries(names.map(name=>['npc-'+crypto.randomUUID(),name.trim()]));
        next=createDoppelkopf({cardSet:await this.resolveSet(args.set,DOPPELKOPF_PROFILE),npcs});
      }
      next.gameId=crypto.randomUUID();
      next.revision=(old?.revision??0)+1;
    } else {
      const active=old?.phase==='wedding'?old.wedding:old?.order[old.turn];
      const id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;
      next=actDoppelkopf(old,id,data.action,args,user.isGM);
    }
    await this.commit(next);
    return this.project(user);
  }

  npcStep() {
    return this.enqueue(async()=>{
      if (!this.enabled()||this.now()<this.wait) return false;
      const move=doppelkopfNpc(this.state);
      if (!move) return false;
      await this.commit(actDoppelkopf(this.state,move.id,move.action,move.args));
      return true;
    });
  }
}
